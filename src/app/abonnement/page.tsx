import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PLANS } from "@/lib/constants";
import { formatEUR, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnement & crédits" };

export default function AbonnementPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-cream/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href="/dashboard" />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
          </Link>
        </div>
      </header>

      <main className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-ink">Choisissez votre formule</h1>
          <p className="mt-2 text-muted-foreground">
            Des vidéos professionnelles à partir de 2,50 € l&apos;unité. Annulable à tout moment.
          </p>
          <p className="mt-3 inline-block rounded-full bg-coral-50 px-3 py-1 text-xs font-medium text-coral-700">
            Paiement sécurisé — bientôt disponible
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "card-base flex flex-col p-6",
                plan.highlighted && "ring-2 ring-coral-400",
              )}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block w-fit rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white">
                  Le plus populaire
                </span>
              )}
              <h2 className="text-lg font-bold text-ink">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-ink">{formatEUR(plan.priceMonthly)}</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-muted px-5 py-3 text-sm font-medium text-muted-foreground"
              >
                Bientôt disponible
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
