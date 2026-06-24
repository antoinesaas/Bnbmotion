"use client";

import { useState } from "react";
import { AlertTriangle, Bell, Check, Loader2 } from "lucide-react";
import { CREDIT_PACKS, pricePerStandardVideo, originalPrice } from "@/lib/constants";
import { formatEUR, formatDateFR, cn } from "@/lib/utils";

async function startCheckout(packId: string) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId }),
  });
  if (res.status === 401) {
    window.location.href = "/login?redirect=/abonnement";
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (data.url) window.location.href = data.url;
  else throw new Error(data.error || "Le paiement n'a pas pu démarrer.");
}

export function BillingTopPanel({
  credits,
  expiresAt,
  tier,
  isAuthed,
}: {
  credits: number;
  expiresAt: string | null;
  tier: string;
  isAuthed: boolean;
}) {
  const [selectedId, setSelectedId] = useState("pack_pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPack = CREDIT_PACKS.find((p) => p.id === selectedId) ?? CREDIT_PACKS[2];
  const has4K = tier === "studio";

  async function handleBuy() {
    if (!isAuthed) {
      window.location.href = "/login?redirect=/abonnement";
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await startCheckout(selectedPack.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* LEFT: Balance Information */}
      <div className="card-base p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-ink">Informations sur le solde</h2>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-ink">
              {credits.toLocaleString("fr-FR")}
              <span className="ml-2 text-lg font-medium text-muted-foreground">crédits</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Solde actuel</p>
          </div>
          <p className="shrink-0 text-right text-xs text-muted-foreground">
            Mis à jour le :<br />
            {formatDateFR(new Date().toISOString())}
          </p>
        </div>

        <div className="my-4 border-t border-border" />

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {expiresAt
            ? `Expire le ${formatDateFR(expiresAt).split(" à")[0]}`
            : "Les crédits expirent 90 jours après le dernier achat"}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-ink">Accès aux fonctionnalités</p>
          <ul className="mt-2 space-y-1.5">
            {[
              "720p & Full HD 1080p — tous les plans",
              has4K ? "4K Ultra HD — déjà inclus ✓" : "4K Ultra HD — pack Studio uniquement",
              "Sans filigrane — tous les plans",
              "Durées disponibles : 5, 10 ou 15 secondes",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-ink/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT: Add Credits */}
      <div className="card-base p-6">
        <h2 className="font-semibold text-ink">Ajouter des crédits</h2>

        <p className="mb-2 mt-4 text-sm font-medium text-ink">Sélectionner un pack</p>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {CREDIT_PACKS.map((pack) => {
            const selected = pack.id === selectedId;
            const orig = originalPrice(pack);
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedId(pack.id)}
                className={cn(
                  "relative rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-coral-400 bg-coral-50 ring-2 ring-coral-300"
                    : "border-border bg-white hover:bg-muted",
                )}
              >
                {pack.discountPercent && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    -{pack.discountPercent}%
                  </span>
                )}
                <p className="text-base font-bold text-ink">{formatEUR(pack.price)}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {pack.credits.toLocaleString("fr-FR")} crédits
                </p>
                {orig && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-through">
                    {formatEUR(orig)}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Prix / vidéo (1080p · 15s) :</span>
          <span className="font-semibold text-ink">
            {formatEUR(pricePerStandardVideo(selectedPack))}
          </span>
          {selectedPack.tier === "studio" && (
            <span className="ml-auto rounded-full bg-coral-100 px-2 py-0.5 text-xs font-medium text-coral-700">
              4K incluse
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleBuy}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-coral-500 py-3 text-sm font-semibold text-white transition hover:bg-coral-600 disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirection vers Stripe…
            </span>
          ) : (
            "Acheter des crédits"
          )}
        </button>
        {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Paiement sécurisé par Stripe · Facture PDF incluse
        </p>
      </div>
    </div>
  );
}
