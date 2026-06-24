"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Wand2, Download, MousePointer2, Check } from "lucide-react";
import { DemoVideo } from "@/components/marketing/demo-video";

const PHRASES = [
  "Analyse des pièces…",
  "Cadrage cinématographique…",
  "Mouvements de caméra…",
  "Étalonnage des lumières…",
  "Rendu final…",
];

function StepFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-5 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-cream">
      {children}
    </div>
  );
}

export function HowItWorks() {
  const [phrase, setPhrase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes hiw-drop {0%{opacity:0;transform:translate(34px,-34px) rotate(10deg)}55%{opacity:1}100%{opacity:1;transform:translate(0,0) rotate(0)}}
        @keyframes hiw-cursor {0%{transform:translate(46px,-30px)}55%{transform:translate(0,0)}100%{transform:translate(0,0)}}
        @keyframes hiw-sweep {0%{transform:translateX(-140%)}100%{transform:translateX(280%)}}
        @keyframes hiw-fill {0%{width:8%}85%{width:100%}100%{width:100%}}
        @keyframes hiw-bob {0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
        @keyframes hiw-pop {0%,30%{transform:scale(.6);opacity:0}55%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
        .hiw-photo{animation:hiw-drop 3.2s ease-in-out infinite}
      `}</style>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Import */}
        <div>
          <StepFrame>
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative flex h-24 w-32 items-end justify-center rounded-xl border-2 border-dashed border-coral-300 bg-white/70">
                <div className="absolute -top-3 left-3 h-3 w-10 rounded-t-md bg-coral-200" />
                <div className="mb-2 flex gap-1.5">
                  <span className="hiw-photo h-9 w-9 rounded-md bg-coral-300" style={{ animationDelay: "0s" }} />
                  <span className="hiw-photo h-9 w-9 rounded-md bg-stone-300" style={{ animationDelay: ".5s" }} />
                  <span className="hiw-photo h-9 w-9 rounded-md bg-coral-200" style={{ animationDelay: "1s" }} />
                </div>
                <MousePointer2
                  className="absolute right-4 top-3 h-5 w-5 fill-ink text-ink"
                  style={{ animation: "hiw-cursor 3.2s ease-in-out infinite" }}
                />
              </div>
            </div>
            <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-coral-600 shadow-soft">
              <ImagePlus className="h-4 w-4" />
            </span>
          </StepFrame>
          <Caption n={1} title="Importez vos photos" text="Glissez 5 à 15 photos de votre logement. Aucun matériel, aucune compétence." />
        </div>

        {/* 2. Génération */}
        <div>
          <StepFrame>
            <div className="absolute inset-0 bg-gradient-to-br from-ink to-coral-900" />
            <div
              className="absolute inset-y-0 w-1/3 bg-white/10"
              style={{ animation: "hiw-sweep 1.8s linear infinite" }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                <Wand2 className="h-6 w-6" style={{ animation: "hiw-bob 1.4s ease-in-out infinite" }} />
              </div>
            </div>
            <div className="absolute inset-x-5 bottom-5">
              <p className="mb-2 text-center text-xs font-medium text-white/90">{PHRASES[phrase]}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-coral-400" style={{ animation: "hiw-fill 4s ease-in-out infinite" }} />
              </div>
            </div>
            <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-coral-600 shadow-soft">
              <Wand2 className="h-4 w-4" />
            </span>
          </StepFrame>
          <Caption n={2} title="L'IA génère la vidéo" text="Mouvements de caméra cinématographiques type drone, traversée des pièces — en quelques minutes." />
        </div>

        {/* 3. Téléchargement — vidéo de démonstration réelle */}
        <div>
          <StepFrame>
            <DemoVideo className="absolute inset-0 h-full w-full" />
            <span
              className="pointer-events-none absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-coral-500 text-white shadow-soft"
              style={{ animation: "hiw-bob 1.6s ease-in-out infinite" }}
            >
              <Download className="h-4 w-4" />
            </span>
            <span
              className="pointer-events-none absolute left-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white text-green-600 shadow-soft"
              style={{ animation: "hiw-pop 3s ease-in-out infinite" }}
            >
              <Check className="h-4 w-4" />
            </span>
          </StepFrame>
          <Caption n={3} title="Téléchargez et publiez" text="Votre vidéo MP4 prête pour Airbnb, Booking, Instagram et vos publicités." />
        </div>
      </div>
    </>
  );
}

function Caption({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">
          {n}
        </span>
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
