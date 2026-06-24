import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSeedanceTask } from "@/lib/seedance";
import { sendEmail, generationReadyEmail, generationFailedEmail } from "@/lib/email";
import { kieCostUsd, type Resolution, type Duration } from "@/lib/constants";

/** Prévient l'utilisateur par e-mail (best-effort, n'échoue jamais la sync). */
async function notify(
  admin: SupabaseClient,
  userId: string,
  build: (propertyName: string, dashboardUrl: string) => { subject: string; html: string },
  propertyName: string,
): Promise<void> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const to = data.user?.email;
    if (!to) return;
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bnbmotion.fr";
    const { subject, html } = build(propertyName || "votre bien", `${base}/dashboard`);
    await sendEmail({ to, subject, html });
  } catch (e) {
    console.error("Notification e-mail échouée:", e);
  }
}

export async function syncGeneration(generationId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: gen } = await admin
    .from("generations")
    .select("id, user_id, status, external_job_id, resolution, requested_seconds, property_name")
    .eq("id", generationId)
    .single();

  if (!gen) return "failed";
  if (gen.status === "completed" || gen.status === "failed") return gen.status;
  if (!gen.external_job_id) return gen.status;

  let task;
  try {
    task = await getSeedanceTask(gen.external_job_id);
  } catch {
    return gen.status;
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

      const cost = kieCostUsd(
        (gen.resolution as Resolution) ?? "1080p",
        ((gen.requested_seconds as number) ?? 15) as Duration,
      );

      const { data: updated } = await admin
        .from("generations")
        .update({
          status: "completed",
          video_path: path,
          cost_usd_estimate: cost,
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", gen.id)
        .neq("status", "completed")
        .select("id")
        .maybeSingle();

      // Un seul appel effectue réellement la transition → un seul e-mail.
      if (updated) {
        await notify(admin, gen.user_id, generationReadyEmail, gen.property_name);
      }

      return "completed";
    } catch (e) {
      console.error("Finalisation génération échouée:", e);
      return gen.status;
    }
  }

  if (task.state === "fail") {
    const { data: updated } = await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: task.failMsg || "La génération a échoué côté fournisseur.",
      })
      .eq("id", gen.id)
      .neq("status", "failed")
      .select("id")
      .maybeSingle();
    await admin.rpc("refund_credit", { p_generation_id: gen.id });
    if (updated) {
      await notify(admin, gen.user_id, generationFailedEmail, gen.property_name);
    }
    return "failed";
  }

  return "processing";
}
