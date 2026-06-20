import Link from "next/link";
import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { SignupForm } from "./signup-form";
import { GoogleSignInButton } from "@/components/ui/google-button";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-ink">Créez votre compte</h1>
        <p className="text-sm text-muted-foreground">
          Commencez gratuitement, sans carte bancaire.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
        <Gift className="h-5 w-5 shrink-0 text-coral-600" />
        <span>
          <strong>1 vidéo offerte</strong> à l&apos;inscription pour tester l&apos;outil.
        </span>
      </div>

      <GoogleSignInButton />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-coral-600 hover:text-coral-700">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
