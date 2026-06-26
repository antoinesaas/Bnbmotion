import Link from "next/link";
import { PiggyBank, TrendingUp, Megaphone, Star, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Hero } from "@/components/marketing/hero";

const BENEFITS = [
  {
    icon: PiggyBank,
    title: "Économisez jusqu'à 1 500 €",
    text: "Un vidéaste professionnel facture 800 à 1 500 € par bien. BnbMotion, c'est quelques euros la vidéo.",
  },
  {
    icon: TrendingUp,
    title: "Plus de réservations",
    text: "Les annonces avec vidéo donnent davantage envie de réserver et se démarquent dans les résultats.",
  },
  {
    icon: Megaphone,
    title: "Du contenu en un clic",
    text: "Alimentez facilement vos publicités et vos réseaux sociaux pour faire connaître votre logement.",
  },
];

const TESTIMONIALS = [
  {
    quote: "En 5 minutes j'avais une vidéo de mon studio. Mes réservations ont augmenté le mois suivant.",
    name: "Marie L.",
    role: "Hôte à Lyon",
  },
  {
    quote: "Je gère 12 appartements, je n'avais pas le temps de filmer. Maintenant chaque bien a sa vidéo.",
    name: "Karim B.",
    role: "Conciergerie à Marseille",
  },
  {
    quote: "Le rendu est bluffant pour le prix. Mes annonces n'ont jamais été aussi pro.",
    name: "Sophie & Tom",
    role: "Hôtes à Biarritz",
  },
];

export default function HomePage() {
  return (
    <div className="bg-cream">
      <SiteHeader isAuthed={false} />

      {/* HERO */}
      <Hero />

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" className="border-t border-border bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-coral-600">
              Comment ça marche
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
              Votre vidéo en 3 étapes
            </h2>
            <p className="mt-4 text-muted-foreground">
              De vos photos à une vidéo prête à publier, sans aucune compétence technique.
            </p>
          </div>
          <div className="mt-14">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* POURQUOI */}
      <section id="pourquoi" className="py-20 sm:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-coral-600">
              Pourquoi BnbMotion
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
              La vidéo qui fait la différence, sans le budget
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <PricingSection />

      {/* TÉMOIGNAGES */}
      <section className="bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-coral-600">Ils l&apos;utilisent</p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-ink sm:text-4xl">
              Des hosts qui gagnent du temps
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
                <div className="mb-3 flex gap-0.5 text-coral-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-coral-500" />
                  ))}
                </div>
                <blockquote className="flex-1 text-ink/90">« {t.quote} »</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-ink">{t.name}</span>
                  <span className="text-muted-foreground"> — {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 sm:py-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center shadow-soft">
            <div className="absolute inset-0 bg-gradient-to-br from-coral-600/40 via-ink to-ink" />
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-coral-500/30 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-bold text-white sm:text-4xl">
                Prêt à booster vos réservations ?
              </h2>
              <p className="mt-4 text-white/80">
                Créez votre première vidéo gratuitement. Aucune carte bancaire requise.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-coral-500 px-7 font-medium text-white shadow-glow transition hover:bg-coral-600"
              >
                Créer ma vidéo offerte <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
