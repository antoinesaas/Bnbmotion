import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Sparkles, Clock, Star } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque (desktop) */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-coral-600/30 via-ink to-ink" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-coral-500/30 blur-3xl" />
        <div className="relative">
          <Logo href="/" className="text-white [&_span]:text-white" />
        </div>
        <div className="relative space-y-8">
          <h2 className="max-w-md font-display text-3xl font-bold leading-tight">
            La vidéo qui donne envie de réserver votre logement.
          </h2>
          <ul className="space-y-4 text-white/80">
            <li className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-coral-300" /> Générée par IA depuis vos photos
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-coral-300" /> Prête en quelques minutes
            </li>
            <li className="flex items-center gap-3">
              <Star className="h-5 w-5 text-coral-300" /> 1 vidéo offerte pour tester
            </li>
          </ul>
          <figure className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <blockquote className="text-sm text-white/90">
              « En 5 minutes j'avais une vidéo de mon studio. Mes réservations ont augmenté
              le mois suivant. »
            </blockquote>
            <figcaption className="mt-3 text-xs text-white/60">
              Marie L. — hôte à Lyon
            </figcaption>
          </figure>
        </div>
        <div className="relative text-xs text-white/40">
          © {new Date().getFullYear()} BnbMotion
        </div>
      </aside>

      {/* Zone formulaire */}
      <main className="flex flex-col px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-ink">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
