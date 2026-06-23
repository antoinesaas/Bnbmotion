import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWalkthroughPrompt } from "@/lib/claude-prompt";
import { createSeedanceTask } from "@/lib/seedance";
import {
  UPLOAD,
  creditCost,
  RESOLUTIONS,
  DURATIONS,
  type Resolution,
  type Duration,
} from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Lance une génération vidéo (gemini-omni-video).
 * Calcule le coût en crédits selon résolution/durée, vérifie le solde,
 * réserve les crédits (remboursés si échec), puis lance la tâche kie.ai.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { propertyName?: string; photoPaths?: string[]; resolution?: string; duration?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const propertyName = (body.propertyName ?? "").trim();
  const photoPaths = Array.isArray(body.photoPaths) ? body.photoPaths : [];
  const resolution = (RESOLUTIONS.includes(body.resolution as Resolution)
    ? body.resolution
    : "1080p") as Resolution;
  const duration = (DURATIONS.includes(body.duration as Duration) ? body.duration : 8) as Duration;

  if (!propertyName) {
    return NextResponse.json({ error: "Le nom de la propriété est requis." }, { status: 400 });
  }
  if (photoPaths.length < UPLOAD.minPhotos || photoPaths.length > UPLOAD.maxPhotos) {
    return NextResponse.json(
      { error: `Veuillez fournir entre ${UPLOAD.minPhotos} et ${UPLOAD.maxPhotos} photos.` },
      { status: 400 },
    );
  }
  if (!photoPaths.every((p) => typeof p === "string" && p.startsWith(`${user.id}/`))) {
    return NextResponse.json({ error: "Photos invalides." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("credits_remaining")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

  const cost = creditCost(resolution, duration);
  if (profile.credits_remaining < cost) {
    return NextResponse.json(
      { error: "Crédits insuffisants.", code: "no_credits", needed: cost, balance: profile.credits_remaining },
      { status: 402 },
    );
  }

  // URLs signées (kie.ai doit pouvoir télécharger les photos) — jusqu'à 7
  const imageUrls: string[] = [];
  for (const path of photoPaths.slice(0, UPLOAD.maxPhotos)) {
    const { data: signed } = await admin.storage.from("listings").createSignedUrl(path, 3600);
    if (signed?.signedUrl) imageUrls.push(signed.signedUrl);
  }
  if (imageUrls.length < UPLOAD.minPhotos) {
    return NextResponse.json({ error: "Impossible de préparer les photos." }, { status: 500 });
  }

  const prompt = await buildWalkthroughPrompt({
    propertyName,
    seconds: duration,
    premium: resolution === "4k",
  });

  // 1) Créer la génération
  const { data: generation, error: insertError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      property_name: propertyName,
      photo_paths: photoPaths,
      status: "pending",
      requested_seconds: duration,
      resolution,
      aspect_ratio: "16:9",
      credit_cost: cost,
      prompt,
      is_free_trial: false,
    })
    .select("id")
    .single();
  if (insertError || !generation) {
    console.error("Création génération échouée:", insertError);
    return NextResponse.json({ error: "Impossible de créer la génération." }, { status: 500 });
  }

  // 2) Réserver les crédits
  const { error: creditError } = await admin.rpc("consume_credit", { p_generation_id: generation.id });
  if (creditError) {
    await admin
      .from("generations")
      .update({ status: "failed", error_message: "Crédits insuffisants." })
      .eq("id", generation.id);
    return NextResponse.json({ error: "Crédits insuffisants.", code: "no_credits" }, { status: 402 });
  }

  // 3) Lancer la tâche
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const callbackUrl = siteUrl.startsWith("https://")
    ? `${siteUrl}/api/webhooks/seedance`
    : undefined;

  try {
    const taskId = await createSeedanceTask({
      prompt,
      imageUrls,
      resolution,
      duration,
      aspectRatio: "16:9",
      callbackUrl,
    });
    await admin
      .from("generations")
      .update({ external_job_id: taskId, status: "processing" })
      .eq("id", generation.id);
    return NextResponse.json({ id: generation.id, status: "processing" });
  } catch (e) {
    console.error("createSeedanceTask échoué:", e);
    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: "Le service de génération est momentanément indisponible. Réessayez.",
      })
      .eq("id", generation.id);
    await admin.rpc("refund_credit", { p_generation_id: generation.id });
    return NextResponse.json(
      { error: "Service de génération indisponible. Crédits remboursés." },
      { status: 502 },
    );
  }
}
