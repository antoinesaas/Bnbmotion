import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Déconnexion (déclenchée par un POST depuis le dashboard). */
export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
