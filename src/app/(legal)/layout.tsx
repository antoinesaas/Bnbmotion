import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background">
      <header className="border-b border-border bg-cream/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href="/" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="space-y-4 text-sm leading-relaxed text-ink/80 [&_a]:text-coral-600 [&_a:hover]:underline [&_h1]:mb-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-ink [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
