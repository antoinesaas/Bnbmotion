import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planWalkthrough } from "@/lib/ai-prompt";
import { maybeAutoRefill } from "@/lib/auto-refill";
import { createSeedanceTask } from "@/lib/seedance";
import {
  UPLOAD,
  DURATIONS,
  KLING_MODE,
  creditCost,
  canUse4K,
  RESOLUTIONS,
  type Resolution,
  type Duration,
} from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RoomGroupBody {
  room: string;
  promptLabel: string;
  paths: string[];
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: {
    propertyName?: string;
    roomGroups?: RoomGroupBody[];
    resolution?: string;
    duration?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const propertyName = (body.propertyName ?? "").trim();
  const roomGroups = Array.isArray(body.roomGroups) ? body.roomGroups : [];
  const resolution = (RESOLUTIONS.includes(body.resolution as Resolution)
    ? body.resolution
    : "1080p") as Resolution;
  const duration = (DURATIONS.includes(body.duration as Duration)
    ? body.duration
    : 15) as Duration;

  if (!propertyName) {
    return NextResponse.json({ error: "Le nom de la propriété est requis." }, { status: 400 });
  }
  if (roomGroups.length < UPLOAD.minRooms || roomGroups.length > UPLOAD.maxRooms) {
    return NextResponse.json(
      { error: `Fournissez entre ${UPLOAD.minRooms} et ${UPLOAD.maxRooms} pièces.` },
      { status: 400 },
    );
  }
  for (const group of roomGroups) {
    if (
      typeof group.room !== "string" ||
      !Array.isArray(group.paths) ||
      group.paths.length < UPLOAD.minPhotosPerRoom ||
      group.paths.length > UPLOAD.maxPhotosPerRoom
    ) {
      return NextResponse.json(
        { error: `Chaque pièce doit contenir ${UPLOAD.minPhotosPerRoom}–${UPLOAD.maxPhotosPerRoom} photos.` },
        { status: 400 },
      );
    }
    if (!group.paths.every((p) => typeof p === "string" && p.startsWith(`${user.id}/`))) {
      return NextResponse.json({ error: "Photos invalides." }, { status: 400 });
    }
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
      { error: "La 4K est disponible dès le pack Pro (49,99 €).", code: "need_pro" },
      { status: 403 },
    );
  }

  const cost = creditCost(resolution, duration);
  if (profile.credits_remaining < cost) {
    return NextResponse.json(
      { error: "Crédits insuffisants.", code: "no_credits", needed: cost, balance: profile.credits_remaining },
      { status: 402 },
    );
  }

  // Signer les URLs pour kie.ai (1h)
  const signedRoomGroups: { room: string; promptLabel: string; imageUrls: string[] }[] = [];
  for (const group of roomGroups) {
    const urls: string[] = [];
    for (const path of group.paths) {
      const { data: signed } = await admin.storage.from("listings").createSignedUrl(path, 3600);
      if (signed?.signedUrl) urls.push(signed.signedUrl);
    }
    if (urls.length < UPLOAD.minPhotosPerRoom) {
      return NextResponse.json({ error: "Impossible de préparer les photos." }, { status: 500 });
    }
    signedRoomGroups.push({ room: group.room, promptLabel: group.promptLabel ?? group.room, imageUrls: urls });
  }

  const plan = await planWalkthrough({
    propertyName,
    roomGroups: signedRoomGroups,
    duration,
    premium: resolution === "4k",
  });

  const allPaths = roomGroups.flatMap((g) => g.paths);

  const { data: generation, error: insertError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      property_name: propertyName,
      photo_paths: allPaths,
      status: "pending",
      requested_seconds: duration,
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

  const { error: creditError } = await admin.rpc("consume_credit", { p_generation_id: generation.id });
  if (creditError) {
    await admin
      .from("generations")
      .update({ status: "failed", error_message: "Crédits insuffisants." })
      .eq("id", generation.id);
    return NextResponse.json({ error: "Crédits insuffisants.", code: "no_credits" }, { status: 402 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const callbackUrl = siteUrl.startsWith("https://") ? `${siteUrl}/api/webhooks/seedance` : undefined;

  try {
    const taskId = await createSeedanceTask({
      prompt: plan.prompt,
      startImageUrl: plan.startImageUrl,
      endImageUrl: plan.endImageUrl,
      klingElements: plan.elements.length > 0 ? plan.elements : undefined,
      mode: KLING_MODE[resolution],
      duration,
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
      .update({ status: "failed", error_message: "Service de génération indisponible. Réessayez." })
      .eq("id", generation.id);
    await admin.rpc("refund_credit", { p_generation_id: generation.id });
    return NextResponse.json(
      { error: "Service de génération indisponible. Crédits remboursés." },
      { status: 502 },
    );
  }
}
