"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CREDIT_PACKS } from "@/lib/constants";

export function AutoRefillToggle({
  enabled,
  packId,
}: {
  enabled: boolean;
  packId: string | null;
}) {
  const [on, setOn] = useState(enabled);
  const [pack, setPack] = useState(packId ?? "pack_pro");
  const [saving, setSaving] = useState(false);

  async function save(nextOn: boolean, nextPack: string) {
    setSaving(true);
    try {
      await fetch("/api/billing/auto-refill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextOn, packId: nextPack }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-base p-6">
      <h2 className="mb-4 font-semibold text-ink">Paiements automatiques</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Configurez la recharge automatique. Quand votre solde descend sous le coût d&apos;une vidéo,
        votre carte enregistrée est débitée automatiquement.
      </p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <RefreshCw className="h-4 w-4 text-coral-500" /> Activer la recharge automatique
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Carte enregistrée lors d&apos;un achat requise.
          </p>
        </div>
        <button
          type="button"
          aria-label="Activer la recharge automatique"
          onClick={() => {
            const n = !on;
            setOn(n);
            save(n, pack);
          }}
          disabled={saving}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60",
            on ? "bg-coral-500" : "bg-stone-300",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
              on ? "left-6" : "left-1",
            )}
          />
        </button>
      </div>

      {on && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-ink">Pack à recharger</label>
          <select
            value={pack}
            onChange={(e) => {
              setPack(e.target.value);
              save(on, e.target.value);
            }}
            className="input-base"
          >
            {CREDIT_PACKS.filter((p) => p.id !== "pack_mini").map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.credits.toLocaleString("fr-FR")} crédits
              </option>
            ))}
          </select>
        </div>
      )}

      {saving && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
        </p>
      )}
    </div>
  );
}
