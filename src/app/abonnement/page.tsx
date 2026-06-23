import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Check, Coins, Sparkles, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { CREDIT_PACKS, videosFromCredits } from "@/lib/constants";
import { formatEUR, cn } from "@/lib/utils";
import { CheckoutButton, PortalButton } from "@/components/billing/checkout-buttons";

export const metadata: Metadata = { title: "Acheter des crédits" };

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { from?: string; checkout?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits = 0;
  let hasCustomer = false;
  const isAuthed = !!user;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("credits_remaining, stripe_customer_id")
      .eq("id", user.id)
      .single();
    credits = data?.credits_remaining ?? 0;
    hasCustomer = !!data?.stripe_customer_id;
  }

  const fromCredits = ["credits", "preview", "download"].includes(searchParams.from ?? "");

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
        {fromCredits && (
          <div className="mx-auto mb-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-coral-200 bg-coral-50 px-5 py-4 text-coral-900">
            <Sparkles className="h-5 w-5 shrink-0 text-coral-600" />
            <p className="text-sm font-medium">
              Rechargez vos crédits pour générer votre vidéo.
            </p>
          </div>
        )}
        {searchParams.checkout === "cancel" && (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-border bg-card px-5 py-3 text-center text-sm text-muted-foreground">
            Paiement annulé — aucun montant n&apos;a été débité.
          </div>
        )}

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">Achetez des crédits</h1>
          <p className="mt-3 text-muted-foreground">
            <strong className="text-ink">1 000 crédits = 1 vidéo</strong> Full HD (jusqu&apos;à 10s,
            7 photos) · une vidéo <strong className="text-ink">4K = 2 000 crédits</strong>. Sans
            abonnement, payez ce que vous générez.
          </p>
          {isAuthed && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1 text-sm font-semibold text-coral-700">
              <Coins className="h-4 w-4" /> Solde : {credits.toLocaleString("fr-FR")} crédits
            </p>
          )}
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 shadow-soft",
                pack.popular ? "border-coral-400 ring-2 ring-coral-400" : "border-border",
              )}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white">
                  Le plus populaire
                </span>
              )}
              <h2 className="text-lg font-bold text-ink">{pack.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">{formatEUR(pack.price)}</span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-coral-700">
                <Coins className="h-4 w-4" /> {pack.credits.toLocaleString("fr-FR")} crédits
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />~{" "}
                  {videosFromCredits(pack.credits)} vidéos Full HD
                </li>
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  Walkthrough jusqu&apos;à 7 photos
                </li>
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  4K disponible · sans filigrane
                </li>
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  Crédits sans expiration
                </li>
              </ul>
              <div className="mt-6">
                {isAuthed ? (
                  <CheckoutButton
                    packId={pack.id}
                    className={cn(
                      "h-11 rounded-xl px-5 text-sm font-medium",
                      pack.popular
                        ? "bg-coral-500 text-white hover:bg-coral-600"
                        : "border border-border bg-white text-ink hover:bg-muted",
                    )}
                  >
                    Acheter
                  </CheckoutButton>
                ) : (
                  <Link
                    href="/signup"
                    className={cn(
                      "inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium",
                      pack.popular
                        ? "bg-coral-500 text-white hover:bg-coral-600"
                        : "border border-border bg-white text-ink hover:bg-muted",
                    )}
                  >
                    Commencer
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {isAuthed && hasCustomer && (
          <div className="mx-auto mt-8 max-w-5xl text-center">
            <PortalButton className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-muted">
              <FileText className="h-4 w-4" /> Mes factures (PDF)
            </PortalButton>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Paiement sécurisé par Stripe · Facture PDF disponible · 1 vidéo offerte à l&apos;inscription
        </p>
      </main>
    </div>
  );
}
