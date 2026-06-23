import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Téléchargement de la vidéo finale. En pay-as-you-go, une vidéo générée
 * (crédits dépensés) appartient à l'utilisateur : pas de paywall.
 * Délivre une URL signée temporaire du bucket privé `videos`.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { data: gen } = await supabase
    .from("generations")
    .select("id, property_name, status, video_path")
    .eq("id", params.id)
    .single();

  if (!gen || gen.status !== "completed" || !gen.video_path) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const filename =
    `${gen.property_name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().slice(0, 60) || "bnbmotion"}.mp4`;

  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from("videos")
    .createSignedUrl(gen.video_path, 120, { download: filename });

  if (!signed?.signedUrl) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.redirect(signed.signedUrl);
}
