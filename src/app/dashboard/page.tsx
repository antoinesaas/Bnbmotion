import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles, Film, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewGenerationForm } from "@/components/dashboard/new-generation-form";
import { GenerationCard } from "@/components/dashboard/generation-card";
import { GenerationPoller } from "@/components/dashboard/generation-poller";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
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
  const subscribed = !!profile?.plan && profile.plan !== "free";
  const gens = generations ?? [];

  // URLs signées pour les vidéos terminées et accessibles (abonné, ou non-essai)
  const videoUrls: Record<string, string> = {};
  const toSign = gens.filter(
    (g) => g.status === "completed" && g.video_path && (!g.is_free_trial || subscribed),
  );
  if (toSign.length > 0) {
    try {
      const admin = createAdminClient();
      await Promise.all(
        toSign.map(async (g) => {
          const { data } = await admin.storage
            .from("videos")
            .createSignedUrl(g.video_path as string, 3600);
          if (data?.signedUrl) videoUrls[g.id] = data.signedUrl;
        }),
      );
    } catch (e) {
      console.error("Signature des vidéos impossible (clé service_role ?) :", e);
    }
  }

  const activeIds = gens.filter((g) => g.status === "pending" || g.status === "processing").map((g) => g.id);

  return (
    <div className="space-y-10">
      <GenerationPoller activeIds={activeIds} />

      {searchParams.checkout === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Paiement réussi ! Vos crédits sont ajoutés à votre compte.
        </div>
      )}

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

        {gens.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {gens.map((g) => (
              <GenerationCard key={g.id} generation={g} videoUrl={videoUrls[g.id]} />
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
