import Link from "next/link";
import { Check, Coins } from "lucide-react";
import { CREDIT_PACKS, videosFromCredits } from "@/lib/constants";
import { formatEUR, cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="tarifs" className="border-t border-border bg-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-coral-600">Tarifs</p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
            Payez à la vidéo, sans abonnement
          </h2>
          <p className="mt-4 text-muted-foreground">
            Achetez des crédits, utilisez-les quand vous voulez (sans expiration).{" "}
            <strong className="text-ink">1 000 crédits = 1 vidéo Full HD.</strong> Bien moins
            cher qu&apos;un vidéaste à 1 500 €.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 shadow-soft",
                pack.popular ? "border-coral-400 ring-2 ring-coral-400" : "border-border",
              )}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Le plus populaire
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{pack.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">{formatEUR(pack.price)}</span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-coral-700">
                <Coins className="h-4 w-4" /> {pack.credits.toLocaleString("fr-FR")} crédits
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />~{" "}
                  {videosFromCredits(pack.credits)} vidéos Full HD
                </li>
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  Walkthrough jusqu&apos;à 7 photos · 4K dispo
                </li>
                <li className="flex items-start gap-2 text-ink/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  MP4 sans filigrane · crédits sans expiration
                </li>
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "mt-7 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition",
                  pack.popular
                    ? "bg-coral-500 text-white hover:bg-coral-600"
                    : "border border-border bg-white text-ink hover:bg-muted",
                )}
              >
                Commencer
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          🎁 <strong className="text-ink">1 vidéo offerte</strong> à l&apos;inscription, sans carte
          bancaire.
        </p>
      </div>
    </section>
  );
}
