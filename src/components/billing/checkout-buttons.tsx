"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || "Le paiement n'a pas pu démarrer.");
  }
}

export function CheckoutButton({
  packId,
  children,
  className,
}: {
  packId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            await startCheckout(packId);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur.");
            setLoading(false);
          }
        }}
        disabled={loading}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 transition disabled:opacity-60",
          className,
        )}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
      {error && <p className="mt-1.5 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PortalButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/stripe/portal", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (data.url) window.location.href = data.url;
          else setLoading(false);
        } catch {
          setLoading(false);
        }
      }}
      disabled={loading}
      className={cn("inline-flex items-center justify-center gap-2 transition disabled:opacity-60", className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
