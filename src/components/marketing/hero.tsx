"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Star, Check, ArrowRight } from "lucide-react";
import { DEMO_VIDEO_URL } from "@/lib/constants";

const CHIP_PHOTOS = [
  "https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-1.jpg",
  "https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-2.jpg",
  "https://gxejkmxzhekscztznsfo.supabase.co/storage/v1/object/public/marketing/hero-photo-3.jpg",
];

/**
 * Hero de la landing.
 * — Desktop : deux colonnes (texte + carte vidéo), sur fond clair.
 * — Mobile : vidéo en plein écran derrière le texte, version raccourcie.
 * Animations d'entrée via GSAP (respecte prefers-reduced-motion).
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-anim", { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 })
        .from(
          ".hero-visual",
          { y: 32, opacity: 0, scale: 0.96, duration: 0.9 },
          "-=0.5",
        );

      // Léger flottement continu des vignettes "vos photos".
      gsap.to(".hero-chip", {
        y: -6,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      {/* Mobile : vidéo de fond + voile sombre pour la lisibilité */}
      <div className="absolute inset-0 lg:hidden">
        <video
          src={DEMO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink/90" />
      </div>

      {/* Desktop : décor clair */}
      <div className="absolute inset-0 hidden lg:block">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-coral-200/40 blur-3xl" />
      </div>

      <div className="container-page relative grid min-h-[86vh] items-center gap-12 py-20 lg:min-h-0 lg:grid-cols-2 lg:py-24">
        {/* Texte */}
        <div className="text-center lg:text-left">
          <span className="hero-anim inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur lg:border-coral-200 lg:bg-white lg:text-coral-700">
            <Star className="h-3.5 w-3.5 fill-coral-400 text-coral-400 lg:fill-coral-500 lg:text-coral-500" />
            <span className="lg:hidden">Vidéo immobilière par IA</span>
            <span className="hidden lg:inline">
              Vidéo immobilière par IA — pour les hosts qui n&apos;ont pas le temps
            </span>
          </span>

          <h1 className="hero-anim mt-5 text-balance text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-6xl lg:text-ink">
            Transformez vos photos en{" "}
            <span className="text-coral-400 lg:text-coral-500">vidéo professionnelle</span>
            <span className="hidden lg:inline"> pour votre logement</span>
          </h1>

          <p className="hero-anim mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg lg:mx-0 lg:text-muted-foreground">
            <span className="lg:hidden">
              Une vidéo qui donne envie de réserver, générée par IA. Sans vidéaste, en quelques
              minutes.
            </span>
            <span className="hidden lg:inline">
              Une vidéo cinématographique qui donne envie de réserver, générée par IA à partir de
              vos photos actuelles. Sans vidéaste, sans matériel, en quelques minutes.
            </span>
          </p>

          <div className="hero-anim mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-coral-500 px-6 font-medium text-white shadow-glow transition hover:bg-coral-600"
            >
              Créer ma vidéo offerte <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#tarifs"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 font-medium text-white backdrop-blur transition hover:bg-white/20 lg:border-border lg:bg-white lg:text-ink lg:hover:bg-muted"
            >
              Voir les tarifs
            </Link>
          </div>

          <p className="hero-anim mt-4 flex items-center justify-center gap-4 text-sm text-white/80 lg:justify-start lg:text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-400 lg:text-green-600" /> 1 vidéo offerte
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-400 lg:text-green-600" /> Sans carte bancaire
            </span>
          </p>
        </div>

        {/* Vidéo desktop */}
        <div className="hero-visual relative hidden lg:block">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-ink shadow-soft">
            <video
              src={DEMO_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="hero-chip absolute -left-4 -top-4 rotate-[-6deg] rounded-xl border border-border bg-white p-2 shadow-soft">
            <div className="flex gap-1.5">
              {CHIP_PHOTOS.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} className="h-9 w-9 rounded-lg object-cover" alt="" />
              ))}
            </div>
            <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground">
              vos photos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
