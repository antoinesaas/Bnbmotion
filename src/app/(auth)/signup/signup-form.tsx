"use client";

import { useFormState } from "react-dom";
import { MailCheck } from "lucide-react";
import { signup, type AuthState } from "../actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState);

  if (state.status === "confirm") {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-coral-50 text-coral-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-ink">Vérifiez votre boîte mail</h2>
        <p className="text-sm text-muted-foreground">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-ink">{state.email}</span>. Cliquez dessus pour
          activer votre compte et récupérer votre vidéo offerte.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nom complet</Label>
        <Input id="full_name" name="full_name" type="text" autoComplete="name" required placeholder="Marie Lambert" />
      </div>

      <div>
        <Label htmlFor="company">
          Société <span className="font-normal text-muted-foreground">(optionnel)</span>
        </Label>
        <Input id="company" name="company" type="text" autoComplete="organization" placeholder="Ma conciergerie" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@exemple.com" />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">Créer mon compte</SubmitButton>

      <p className="text-center text-xs text-muted-foreground">
        En créant un compte, vous acceptez nos conditions d&apos;utilisation.
      </p>
    </form>
  );
}
