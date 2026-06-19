import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildVideoPrompt } from "@/lib/prompt";
import { createSeedanceTask } from "@/lib/seedance";
import { UPLOAD, getRenderParams } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Lance une génération vidéo Seedance (kie.ai).
 * Flux : valide -> crée la génération (pending) -> RÉSERVE 1 crédit ->
 * crée la tâche kie.ai (image phare signée + prompt) -> passe en `processing`.
 * Le crédit est remboursé automatiquement si la génération échoue.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

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
    .select("credits_remaining, plan")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }
  if (profile.credits_remaining < 1) {
    return NextResponse.json({ error: "Crédits insuffisants.", code: "no_credits" }, { status: 402 });
  }

  const render = getRenderParams(profile.plan);
  const isFreeTrial = profile.plan === "free";
  const prompt = buildVideoPrompt({
    propertyName,
    seconds: render.seconds,
    premium: profile.plan === "agency",
  });

  // URL signée de la photo phare (kie.ai doit pouvoir la télécharger)
  const { data: signed, error: signErr } = await admin.storage
    .from("listings")
    .createSignedUrl(photoPaths[0], 3600);
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Impossible de préparer la photo." }, { status: 500 });
  }

  // 1) Créer la génération (pending)
  const { data: generation, error: insertError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      property_name: propertyName,
      photo_paths: photoPaths,
      status: "pending",
      requested_seconds: render.seconds,
      resolution: render.resolution,
      aspect_ratio: render.aspectRatio,
      generate_audio: render.audio,
      is_free_trial: isFreeTrial,
      prompt,
    })
    .select("id")
    .single();

  if (insertError || !generation) {
    console.error("Création génération échouée:", insertError);
    return NextResponse.json({ error: "Impossible de créer la génération." }, { status: 500 });
  }

  // 2) Réserver 1 crédit
  const { error: creditError } = await admin.rpc("consume_credit", {
    p_generation_id: generation.id,
  });
  if (creditError) {
    await admin
      .from("generations")
      .update({ status: "failed", error_message: "Crédits insuffisants." })
      .eq("id", generation.id);
    return NextResponse.json({ error: "Crédits insuffisants.", code: "no_credits" }, { status: 402 });
  }

  // 3) Lancer la tâche Seedance
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const callbackUrl = siteUrl.startsWith("https://")
    ? `${siteUrl}/api/webhooks/seedance`
    : undefined;

  try {
    const taskId = await createSeedanceTask({
      prompt,
      imageUrls: [signed.signedUrl],
      aspectRatio: render.aspectRatio,
      resolution: render.resolution,
      duration: render.seconds,
      generateAudio: render.audio,
      fixedLens: false,
      callbackUrl,
    });

    await admin
      .from("generations")
      .update({ external_job_id: taskId, status: "processing" })
      .eq("id", generation.id);

    return NextResponse.json({ id: generation.id, status: "processing" });
  } catch (e) {
    console.error("Seedance createTask échoué:", e);
    // Échec immédiat -> marquer failed + rembourser le crédit
    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: "Le service de génération est indisponible. Réessayez.",
      })
      .eq("id", generation.id);
    await admin.rpc("refund_credit", { p_generation_id: generation.id });
    return NextResponse.json(
      { error: "Le service de génération est momentanément indisponible. Crédit remboursé." },
      { status: 502 },
    );
  }
}
