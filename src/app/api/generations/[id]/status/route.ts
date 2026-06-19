import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncGeneration } from "@/lib/generation";

export const runtime = "nodejs";

/** Renvoie le statut d'une génération (et la finalise si kie.ai a terminé). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // RLS garantit que l'utilisateur ne voit que ses propres générations.
  const { data: gen } = await supabase
    .from("generations")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!gen) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  let status = gen.status;
  if (gen.status === "pending" || gen.status === "processing") {
    try {
      status = await syncGeneration(params.id);
    } catch {
      /* on garde le statut courant en cas d'erreur transitoire */
    }
  }

  return NextResponse.json({ status });
}
