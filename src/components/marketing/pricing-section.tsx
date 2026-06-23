import Link from "next/link";
import { Check, Coins } from "lucide-react";
import { CREDIT_PACKS, pricePerStandardVideo, originalPrice } from "@/lib/constants";
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
            Achetez des crédits, utilisez-les quand vous voulez. Bien moins cher qu&apos;un vidéaste
            à 1 500 €.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => {
            const orig = originalPrice(pack);
            return (
              <div
                key={pack.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 shadow-soft",
                  pack.popular ? "border-coral-400 ring-2 ring-coral-400" : "border-border",
                )}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    Le plus populaire
                  </span>
                )}
                {pack.discountPercent && (
                  <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                    −{pack.discountPercent}%
                  </span>
                )}
                <h3 className="text-lg font-bold text-ink">{pack.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-ink">{formatEUR(pack.price)}</span>
                  {orig && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatEUR(orig)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-coral-700">
                  <Coins className="h-4 w-4" /> {pack.credits.toLocaleString("fr-FR")} crédits
                </p>
                <p className="mt-3 text-sm text-ink/80">
                  <strong>{formatEUR(pricePerStandardVideo(pack))}</strong>
                  <span className="text-muted-foreground"> / vidéo (1080p · 10s)</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  <li className="flex items-start gap-2 text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    Walkthrough jusqu&apos;à 7 photos
                  </li>
                  <li className="flex items-start gap-2 text-ink/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    {pack.tier === "pro" || pack.tier === "studio" ? "4K incluse" : "Full HD 1080p"}{" "}
                    · sans filigrane
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition",
                    pack.popular
                      ? "bg-coral-500 text-white hover:bg-coral-600"
                      : "border border-border bg-white text-ink hover:bg-muted",
                  )}
                >
                  Commencer
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          🎁 <strong className="text-ink">1 000 crédits offerts</strong> à l&apos;inscription, sans
          carte bancaire · crédits valables 90 jours.
        </p>
      </div>
    </section>
  );
}
