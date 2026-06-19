import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-cream">
      <div className="container-page py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo href="/" />
            <p className="mt-3 text-sm text-muted-foreground">
              La vidéo professionnelle de votre logement, générée par IA à partir de vos photos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-ink">Produit</p>
              <Link href="#comment" className="block text-muted-foreground hover:text-ink">Comment ça marche</Link>
              <Link href="#tarifs" className="block text-muted-foreground hover:text-ink">Tarifs</Link>
              <Link href="/signup" className="block text-muted-foreground hover:text-ink">Créer un compte</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">Compte</p>
              <Link href="/login" className="block text-muted-foreground hover:text-ink">Connexion</Link>
              <Link href="/abonnement" className="block text-muted-foreground hover:text-ink">Abonnement</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">Légal</p>
              <span className="block text-muted-foreground">Mentions légales</span>
              <span className="block text-muted-foreground">Confidentialité</span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} BnbMotion. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
