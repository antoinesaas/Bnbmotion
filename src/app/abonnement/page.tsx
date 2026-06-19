import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Check, Sparkles, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { PLANS, CREDIT_PACKS, getPlan } from "@/lib/constants";
import { formatEUR, cn } from "@/lib/utils";
import { CheckoutButton, PortalButton } from "@/components/billing/checkout-buttons";

export const metadata: Metadata = { title: "Abonnement & crédits" };

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { from?: string; checkout?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plan = "free";
  let credits = 0;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("plan, credits_remaining")
      .eq("id", user.id)
      .single();
    plan = data?.plan ?? "free";
    credits = data?.credits_remaining ?? 0;
  }
  const isAuthed = !!user;
  const subscribed = plan !== "free";
  const fromVideo = searchParams.from === "preview" || searchParams.from === "download";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-cream/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href={isAuthed ? "/dashboard" : "/"} />
          <Link
            href={isAuthed ? "/dashboard" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> {isAuthed ? "Tableau de bord" : "Accueil"}
          </Link>
        </div>
      </header>

      <main className="container-page py-12">
        {fromVideo && (
          <div className="mx-auto mb-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-coral-200 bg-coral-50 px-5 py-4 text-coral-900">
            <Sparkles className="h-5 w-5 shrink-0 text-coral-600" />
            <p className="text-sm font-medium">
              🎬 Votre vidéo est prête ! Abonnez-vous pour la regarder en HD et la télécharger sans
              filigrane.
            </p>
          </div>
        )}
        {searchParams.checkout === "cancel" && (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-border bg-card px-5 py-3 text-center text-sm text-muted-foreground">
            Paiement annulé — aucun montant n&apos;a été débité.
          </div>
        )}

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">Choisissez votre formule</h1>
          <p className="mt-3 text-muted-foreground">
            Des vidéos professionnelles à partir de {formatEUR(2.5)} l&apos;unité. Annulable à tout
            moment.
          </p>
        </div>

        {subscribed && (
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral-50 text-coral-600">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">
                  Abonnement actif : {getPlan(plan)?.name ?? plan}
                </p>
                <p className="text-sm text-muted-foreground">
                  {credits} crédit{credits > 1 ? "s" : ""} restant{credits > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <PortalButton className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-muted">
              Gérer mon abonnement
            </PortalButton>
          </div>
        )}

        {/* Plans */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
          {PLANS.map((p) => {
            const current = isAuthed && plan === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-7 shadow-soft",
                  p.highlighted ? "border-coral-400 ring-2 ring-coral-400" : "border-border",
                )}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white">
                    Le plus populaire
                  </span>
                )}
                <h2 className="text-lg font-bold text-ink">{p.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-ink">{formatEUR(p.priceMonthly)}</span>
                  <span className="text-sm text-muted-foreground">/ mois</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-ink/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  {current ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-muted text-sm font-medium text-muted-foreground">
                      Votre plan actuel
                    </span>
                  ) : isAuthed ? (
                    <CheckoutButton
                      kind="subscription"
                      id={p.id}
                      className={cn(
                        "h-11 rounded-xl px-5 text-sm font-medium",
                        p.highlighted
                          ? "bg-coral-500 text-white hover:bg-coral-600"
                          : "border border-border bg-white text-ink hover:bg-muted",
                      )}
                    >
                      Choisir {p.name}
                    </CheckoutButton>
                  ) : (
                    <Link
                      href="/signup"
                      className={cn(
                        "inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium",
                        p.highlighted
                          ? "bg-coral-500 text-white hover:bg-coral-600"
                          : "border border-border bg-white text-ink hover:bg-muted",
                      )}
                    >
                      Commencer
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Packs */}
        <div className="mx-auto mt-10 max-w-5xl">
          <h2 className="text-center text-lg font-semibold text-ink">
            Ou rechargez à l&apos;unité, sans abonnement
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-soft"
              >
                <p className="text-2xl font-bold text-ink">{pack.credits} vidéos</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatEUR(pack.price)}</p>
                <p className="mb-4 mt-0.5 text-xs text-muted-foreground">
                  {formatEUR(pack.price / pack.credits)} / vidéo
                </p>
                {isAuthed ? (
                  <CheckoutButton
                    kind="pack"
                    id={pack.id}
                    className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-muted"
                  >
                    Acheter
                  </CheckoutButton>
                ) : (
                  <Link
                    href="/signup"
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-muted"
                  >
                    Acheter
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Paiement sécurisé par Stripe · Sans engagement · Annulable en 1 clic
        </p>
      </main>
    </div>
  );
}
