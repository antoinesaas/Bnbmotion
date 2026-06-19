import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, CREDIT_PACKS } from "@/lib/constants";
import { formatEUR, cn } from "@/lib/utils";

export function PricingSection({
  ctaHref = "/signup",
}: {
  ctaHref?: string;
}) {
  return (
    <section id="tarifs" className="border-t border-border bg-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-coral-600">Tarifs</p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
            Bien moins cher qu&apos;un vidéaste
          </h2>
          <p className="mt-4 text-muted-foreground">
            Un vidéaste facture 800 à 1500 € par bien. Ici, c&apos;est quelques euros la vidéo.
            Annulable à tout moment.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 shadow-soft",
                plan.highlighted ? "border-coral-400 ring-2 ring-coral-400" : "border-border",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Le plus populaire
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">{formatEUR(plan.priceMonthly)}</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.videosPerMonth} vidéos · soit {formatEUR(plan.priceMonthly / plan.videosPerMonth)} / vidéo
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={cn(
                  "mt-7 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition",
                  plan.highlighted
                    ? "bg-coral-500 text-white hover:bg-coral-600"
                    : "border border-border bg-white text-ink hover:bg-muted",
                )}
              >
                Commencer avec {plan.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="text-sm font-semibold text-ink">Besoin ponctuel ? Packs de crédits sans abonnement</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {CREDIT_PACKS.map((pack) => (
              <span key={pack.id}>
                <strong className="text-ink">{pack.credits} vidéos</strong> — {formatEUR(pack.price)}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Pas sûr ? <Link href="/signup" className="font-semibold text-coral-600 hover:text-coral-700">Testez avec 1 vidéo offerte</Link>, sans carte bancaire.
        </p>
      </div>
    </section>
  );
}
