import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewGenerationForm } from "@/components/dashboard/new-generation-form";
import { GenerationCard } from "@/components/dashboard/generation-card";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: generations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, credits_remaining, plan, max_video_seconds")
      .eq("id", user.id)
      .single(),
    supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const firstName = profile?.full_name?.trim().split(" ")[0] || "👋";
  const credits = profile?.credits_remaining ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transformez les photos de votre logement en vidéo professionnelle.
        </p>
      </div>

      {/* Création */}
      <section className="card-base p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral-50 text-coral-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-ink">Créer une nouvelle vidéo</h2>
            <p className="text-xs text-muted-foreground">
              {credits > 0
                ? `Vous avez ${credits} crédit${credits > 1 ? "s" : ""} disponible${credits > 1 ? "s" : ""}.`
                : "Vous n'avez plus de crédit."}
            </p>
          </div>
        </div>

        <NewGenerationForm
          userId={user.id}
          credits={credits}
          maxSeconds={profile?.max_video_seconds ?? 10}
        />
      </section>

      {/* Historique */}
      <section className="space-y-4">
        <h2 className="font-semibold text-ink">Vos générations</h2>

        {generations && generations.length > 0 ? (
          <div className="space-y-3">
            {generations.map((g) => (
              <GenerationCard key={g.id} generation={g} />
            ))}
          </div>
        ) : (
          <div className="card-base flex flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Film className="h-6 w-6" />
            </span>
            <p className="font-medium text-ink">Aucune vidéo pour le moment</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ajoutez les photos de votre premier logement ci-dessus pour générer votre vidéo.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
