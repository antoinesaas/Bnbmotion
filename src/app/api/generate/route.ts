import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planWalkthrough } from "@/lib/ai-prompt";
import { maybeAutoRefill } from "@/lib/auto-refill";
import { createSeedanceTask } from "@/lib/seedance";
import {
  UPLOAD,
  FIXED_DURATION,
  KLING_MODE,
  creditCost,
  canUse4K,
  RESOLUTIONS,
  type Resolution,
} from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Lance une génération vidéo (Kling 3.0 — 15s fixe).
 * Durée fixe 15s, résolution choisie par l'utilisateur (720p/1080p/4k).
 * Utilise start_frame + end_frame + kling_elements pour utiliser les vraies photos.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { propertyName?: string; photoPaths?: string[]; resolution?: string };
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
    .select("credits_remaining, tier")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

  if (resolution === "4k" && !canUse4K(profile.tier)) {
    return NextResponse.json(
      { error: "La 4K est réservée au pack Pro et au-dessus.", code: "need_pro" },
      { status: 403 },
    );
  }

  const cost = creditCost(resolution);
  if (profile.credits_remaining < cost) {
    return NextResponse.json(
      { error: "Crédits insuffisants.", code: "no_credits", needed: cost, balance: profile.credits_remaining },
      { status: 402 },
    );
  }

  // URLs signées 1h (kie.ai doit pouvoir télécharger les photos)
  const imageUrls: string[] = [];
  for (const path of photoPaths.slice(0, UPLOAD.maxPhotos)) {
    const { data: signed } = await admin.storage.from("listings").createSignedUrl(path, 3600);
    if (signed?.signedUrl) imageUrls.push(signed.signedUrl);
  }
  if (imageUrls.length < UPLOAD.minPhotos) {
    return NextResponse.json({ error: "Impossible de préparer les photos." }, { status: 500 });
  }

  // GPT-4o-mini analyse les photos, groupe par pièce, écrit le prompt Kling 3.0
  const plan = await planWalkthrough({
    propertyName,
    imageUrls,
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
      requested_seconds: FIXED_DURATION,
      resolution,
      aspect_ratio: "16:9",
      credit_cost: cost,
      prompt: plan.prompt,
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

  // 3) Lancer la tâche Kling 3.0
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const callbackUrl = siteUrl.startsWith("https://")
    ? `${siteUrl}/api/webhooks/seedance`
    : undefined;

  try {
    const taskId = await createSeedanceTask({
      prompt: plan.prompt,
      startImageUrl: plan.startImageUrl,
      endImageUrl: plan.endImageUrl,
      klingElements: plan.elements.length > 0 ? plan.elements : undefined,
      mode: KLING_MODE[resolution],
      aspectRatio: "16:9",
      callbackUrl,
    });
    await admin
      .from("generations")
      .update({ external_job_id: taskId, status: "processing" })
      .eq("id", generation.id);
    await maybeAutoRefill(user.id);
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
