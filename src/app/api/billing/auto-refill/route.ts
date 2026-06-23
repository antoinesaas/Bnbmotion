import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPack } from "@/lib/constants";

export const runtime = "nodejs";

/** Active/désactive la recharge automatique et choisit le pack. */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const enabled = !!body.enabled;
  const pack = getPack(body.packId);

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ auto_refill_enabled: enabled, auto_refill_pack: pack?.id ?? null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
