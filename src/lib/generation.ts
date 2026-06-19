import { createAdminClient } from "@/lib/supabase/admin";
import { getSeedanceTask } from "@/lib/seedance";
import { estimateCostUsd, type Resolution } from "@/lib/constants";

/**
 * Synchronise une génération avec kie.ai.
 * - succès  : télécharge la vidéo dans le bucket privé `videos`, calcule le coût,
 *             passe en `completed`.
 * - échec   : passe en `failed` et rembourse automatiquement le crédit.
 * Idempotent : peut être appelé par le polling client ET par le callback kie.ai.
 *
 * Renvoie le statut final : "processing" | "completed" | "failed".
 */
export async function syncGeneration(generationId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: gen } = await admin
    .from("generations")
    .select(
      "id, user_id, status, external_job_id, requested_seconds, resolution, generate_audio",
    )
    .eq("id", generationId)
    .single();

  if (!gen) return "failed";
  if (gen.status === "completed" || gen.status === "failed") return gen.status;
  if (!gen.external_job_id) return gen.status;

  let task;
  try {
    task = await getSeedanceTask(gen.external_job_id);
  } catch {
    return gen.status; // erreur transitoire : on retentera au prochain poll
  }

  if (task.state === "success" && task.resultUrls[0]) {
    try {
      const resp = await fetch(task.resultUrls[0]);
      if (!resp.ok) return gen.status;
      const buffer = Buffer.from(await resp.arrayBuffer());
      const path = `${gen.user_id}/${gen.id}.mp4`;

      const { error: upErr } = await admin.storage
        .from("videos")
        .upload(path, buffer, { contentType: "video/mp4", upsert: true });
      if (upErr) {
        console.error("Upload vidéo échoué:", upErr);
        return gen.status;
      }

      const cost = estimateCostUsd(
        (gen.resolution as Resolution) ?? "720p",
        gen.requested_seconds,
        gen.generate_audio,
      );

      await admin
        .from("generations")
        .update({
          status: "completed",
          video_path: path,
          cost_usd_estimate: cost,
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", gen.id)
        .neq("status", "completed");

      return "completed";
    } catch (e) {
      console.error("Finalisation génération échouée:", e);
      return gen.status;
    }
  }

  if (task.state === "fail") {
    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: task.failMsg || "La génération a échoué côté fournisseur.",
      })
      .eq("id", gen.id)
      .neq("status", "failed");
    // Remboursement idempotent (refund_credit vérifie credit_consumed).
    await admin.rpc("refund_credit", { p_generation_id: gen.id });
    return "failed";
  }

  return "processing";
}
