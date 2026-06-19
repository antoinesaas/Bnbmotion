import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncGeneration } from "@/lib/generation";

export const runtime = "nodejs";

/**
 * Callback kie.ai (callBackUrl). On en extrait le taskId, on retrouve la
 * génération et on la synchronise. syncGeneration re-vérifie l'état réel
 * auprès de kie.ai, donc un callback falsifié ne peut rien corrompre.
 */
export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const taskId: string | undefined = payload?.data?.taskId ?? payload?.taskId;
  if (!taskId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: gen } = await admin
    .from("generations")
    .select("id")
    .eq("external_job_id", taskId)
    .maybeSingle();

  if (gen) {
    try {
      await syncGeneration(gen.id);
    } catch (e) {
      console.error("Sync via callback échoué:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
