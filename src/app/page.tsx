import Link from "next/link";
import { PiggyBank, TrendingUp, Megaphone, Star, Check, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { DemoVideo } from "@/components/marketing/demo-video";

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-coral-200/40 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-white px-3 py-1 text-xs font-medium text-coral-700">
              <Star className="h-3.5 w-3.5 fill-coral-500 text-coral-500" />
              Vidéo immobilière par IA — pour les hosts qui n&apos;ont pas le temps
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              Transformez vos photos en{" "}
              <span className="text-coral-500">vidéo professionnelle</span> pour votre logement
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Une vidéo cinématographique qui donne envie de réserver, générée par IA à partir de
              vos photos actuelles. Sans vidéaste, sans matériel, en quelques minutes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-coral-500 px-6 font-medium text-white shadow-glow transition hover:bg-coral-600"
              >
                Créer ma vidéo offerte <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#tarifs"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 font-medium text-ink transition hover:bg-muted"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" /> 1 vidéo offerte
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" /> Sans carte bancaire
              </span>
            </p>
          </div>

          {/* Vidéo de démonstration */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <DemoVideo
              label="Studio cosy vue mer"
              className="mx-auto aspect-[4/3] w-full max-w-lg rounded-3xl border border-border shadow-soft"
            />
            {/* chips photos -> vidéo */}
            <div className="absolute -left-4 -top-4 hidden rotate-[-6deg] rounded-xl border border-border bg-white p-2 shadow-soft sm:block">
              <div className="flex gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-1.jpg" className="h-9 w-9 rounded-lg object-cover" alt="" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-2.jpg" className="h-9 w-9 rounded-lg object-cover" alt="" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-3.jpg" className="h-9 w-9 rounded-lg object-cover" alt="" />
              </div>
              <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground">vos photos</p>
            </div>
          </div>
        </div>
      </section>

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
