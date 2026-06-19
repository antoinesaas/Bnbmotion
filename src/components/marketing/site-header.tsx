import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteHeader({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo href="/" />

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
          <Link href="#comment" className="transition hover:text-ink">Comment ça marche</Link>
          <Link href="#pourquoi" className="transition hover:text-ink">Pourquoi</Link>
          <Link href="#tarifs" className="transition hover:text-ink">Tarifs</Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-xl bg-coral-500 px-4 text-sm font-medium text-white transition hover:bg-coral-600"
            >
              Mon tableau de bord
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center rounded-xl px-4 text-sm font-medium text-ink transition hover:bg-muted sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-xl bg-coral-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-coral-600"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
