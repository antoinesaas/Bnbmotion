"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "ask" | "reason" | "done";

export function GenerationFeedback({
  generationId,
  alreadyGiven = false,
}: {
  generationId: string;
  alreadyGiven?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(alreadyGiven ? "done" : "ask");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(satisfied: boolean, reasonText?: string) {
    setLoading(true);
    try {
      await fetch(`/api/generations/${generationId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satisfied, reason: reasonText }),
      });
    } catch {
      /* on n'embête pas l'utilisateur si l'envoi échoue */
    } finally {
      setLoading(false);
      setPhase("done");
    }
  }

  if (phase === "done") {
    return (
      <p className="flex items-center gap-1.5 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-green-600" />
        Merci pour votre retour !
      </p>
    );
  }

  if (phase === "reason") {
    return (
      <div className="space-y-2 border-t border-border px-4 py-3">
        <p className="text-xs font-medium text-ink">Qu&apos;est-ce qui n&apos;allait pas ?</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Pièces oubliées, mouvements incohérents, qualité…"
          className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-xs text-ink outline-none focus:border-coral-300 focus:ring-1 focus:ring-coral-200"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => send(false, reason)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-coral-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            Envoyer
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => send(false)}
            className="text-xs text-muted-foreground hover:text-ink"
          >
            Passer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
      <span className="text-xs font-medium text-ink">Satisfait du résultat ?</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => send(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:border-green-300 hover:bg-green-50 hover:text-green-700",
            loading && "opacity-60",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" /> Oui
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setPhase("reason")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          <ThumbsDown className="h-3.5 w-3.5" /> Non
        </button>
      </div>
    </div>
  );
}
