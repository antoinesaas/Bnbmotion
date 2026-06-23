"use client";

import { useFormState } from "react-dom";
import { KeyRound } from "lucide-react";
import { updatePassword, type AuthState } from "../actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = {};

export default function ResetPasswordPage() {
  const [state, action] = useFormState(updatePassword, initial);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-ink">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div>
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton className="w-full">
          <KeyRound className="h-4 w-4" /> Enregistrer le mot de passe
        </SubmitButton>
      </form>
    </div>
  );
}
