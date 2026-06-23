"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, type AuthState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = {};

export default function ForgotPasswordPage() {
  const [state, action] = useFormState(requestPasswordReset, initial);

  if (state.status === "confirm") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Vérifiez votre boîte mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Un lien de réinitialisation a été envoyé à{" "}
            <strong className="text-ink">{state.email}</strong>. Cliquez sur le lien dans
            l&apos;email pour choisir un nouveau mot de passe.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Pas reçu ?{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-semibold text-coral-600 hover:text-coral-700"
          >
            Renvoyer
          </button>
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-ink">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.com"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton className="w-full">
          <Mail className="h-4 w-4" /> Envoyer le lien
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-coral-600 hover:text-coral-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
