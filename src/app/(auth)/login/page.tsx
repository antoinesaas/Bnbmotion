import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { GoogleSignInButton } from "@/components/ui/google-button";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  const redirectTo =
    searchParams.redirect && searchParams.redirect.startsWith("/")
      ? searchParams.redirect
      : "/dashboard";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-ink">Bon retour 👋</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour générer vos vidéos.
        </p>
      </div>

      {searchParams.error === "auth" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Le lien de confirmation est invalide ou expiré. Réessayez de vous connecter.
        </p>
      )}

      <GoogleSignInButton redirectTo={redirectTo} />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <LoginForm redirectTo={redirectTo} />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-semibold text-coral-600 hover:text-coral-700">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
