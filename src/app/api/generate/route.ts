import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildVideoPrompt } from "@/lib/prompt";
import { UPLOAD } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Crée une génération vidéo.
 *
 * Flux : le client a déjà uploadé les photos dans le bucket `listings`
 * (dossier de l'utilisateur). On valide, on crée la ligne `generations`,
 * puis on RÉSERVE 1 crédit (consume_credit). Le crédit sera remboursé
 * automatiquement si la génération échoue (Phase génération vidéo).
 *
 * NOTE : l'appel effectif à Seedance + le suivi de statut seront branchés
 * dans la phase génération. Pour l'instant la génération reste en `pending`.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: { propertyName?: string; photoPaths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const propertyName = (body.propertyName ?? "").trim();
  const photoPaths = Array.isArray(body.photoPaths) ? body.photoPaths : [];

  if (!propertyName) {
    return NextResponse.json({ error: "Le nom de la propriété est requis." }, { status: 400 });
  }
  if (photoPaths.length < UPLOAD.minPhotos || photoPaths.length > UPLOAD.maxPhotos) {
    return NextResponse.json(
      { error: `Veuillez fournir entre ${UPLOAD.minPhotos} et ${UPLOAD.maxPhotos} photos.` },
      { status: 400 },
    );
  }
  // Sécurité : toutes les photos doivent appartenir au dossier de l'utilisateur.
  if (!photoPaths.every((p) => typeof p === "string" && p.startsWith(`${user.id}/`))) {
    return NextResponse.json({ error: "Photos invalides." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Configuration serveur incomplète (clé service_role)." },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credits_remaining, plan, max_video_seconds")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }
  if (profile.credits_remaining < 1) {
    return NextResponse.json(
      { error: "Crédits insuffisants.", code: "no_credits" },
      { status: 402 },
    );
  }

  const seconds = profile.max_video_seconds ?? 10;
  const isFreeTrial = profile.plan === "free";
  const prompt = buildVideoPrompt({
    propertyName,
    seconds,
    premium: profile.plan === "agency",
  });

  // 1) Créer la génération (pending)
  const { data: generation, error: insertError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      property_name: propertyName,
      photo_paths: photoPaths,
      status: "pending",
      requested_seconds: seconds,
      is_free_trial: isFreeTrial,
      prompt,
    })
    .select("id")
    .single();

  if (insertError || !generation) {
    console.error("Erreur création génération:", insertError);
    return NextResponse.json({ error: "Impossible de créer la génération." }, { status: 500 });
  }

  // 2) Réserver 1 crédit (remboursé automatiquement en cas d'échec)
  const { error: creditError } = await admin.rpc("consume_credit", {
    p_generation_id: generation.id,
  });

  if (creditError) {
    await admin
      .from("generations")
      .update({ status: "failed", error_message: "Crédits insuffisants." })
      .eq("id", generation.id);
    return NextResponse.json(
      { error: "Crédits insuffisants.", code: "no_credits" },
      { status: 402 },
    );
  }

  // 3) [Phase génération] Lancer Seedance ici, passer en `processing`,
  //    stocker external_job_id, puis suivre le statut (polling/webhook).

  return NextResponse.json({ id: generation.id, status: "pending" });
}
