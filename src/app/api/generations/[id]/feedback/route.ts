import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Enregistre l'avis de l'utilisateur sur une génération terminée :
 * satisfait (oui/non) + raison facultative. Stocké dans `generation_feedback`
 * pour que l'équipe puisse rembourser des crédits ou améliorer l'outil.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { satisfied?: boolean; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.satisfied !== "boolean") {
    return NextResponse.json({ error: "Avis manquant." }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : null;

  // RLS : l'utilisateur ne peut lire que ses propres générations.
  const { data: gen } = await supabase
    .from("generations")
    .select("id, property_name, created_at, status")
    .eq("id", params.id)
    .single();

  if (!gen) return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  // upsert sur generation_id : un seul avis par vidéo, modifiable.
  const { error } = await admin.from("generation_feedback").upsert(
    {
      generation_id: gen.id,
      user_id: user.id,
      user_email: user.email ?? null,
      property_name: gen.property_name,
      generation_created_at: gen.created_at,
      satisfied: body.satisfied,
      reason: body.satisfied ? null : reason,
    },
    { onConflict: "generation_id" },
  );

  if (error) {
    console.error("Enregistrement avis échoué:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer votre avis." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
