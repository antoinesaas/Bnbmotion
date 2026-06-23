import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileText, Receipt, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";
import { formatDateFR, cn } from "@/lib/utils";
import { PortalButton } from "@/components/billing/checkout-buttons";
import { AutoRefillToggle } from "@/components/billing/auto-refill-toggle";
import { BillingTopPanel } from "@/components/billing/billing-top-panel";

export const metadata: Metadata = { title: "Crédits & facturation" };

const REASON_LABELS: Record<string, string> = {
  signup_bonus: "Bonus de bienvenue",
  credit_pack: "Achat de crédits",
  generation: "Génération vidéo",
  refund: "Remboursement (échec)",
  auto_refill: "Recharge automatique",
  admin_adjustment: "Ajustement",
};

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { from?: string; checkout?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  let credits = 0;
  let expiresAt: string | null = null;
  let tier = "free";
  let hasCustomer = false;
  let autoRefill = false;
  let autoRefillPack: string | null = null;
  let transactions: Array<{
    id: string;
    reason: string;
    amount: number;
    created_at: string;
  }> = [];

  if (user) {
    const [{ data: profile }, { data: txs }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "credits_remaining, credits_expire_at, tier, stripe_customer_id, auto_refill_enabled, auto_refill_pack",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("credit_transactions")
        .select("id, reason, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    credits = profile?.credits_remaining ?? 0;
    expiresAt = profile?.credits_expire_at ?? null;
    tier = profile?.tier ?? "free";
    hasCustomer = !!profile?.stripe_customer_id;
    autoRefill = profile?.auto_refill_enabled ?? false;
    autoRefillPack = profile?.auto_refill_pack ?? null;
    transactions = txs ?? [];
  }

  const fromCredits = ["credits", "preview", "download", "4k"].includes(searchParams.from ?? "");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-cream/80 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo href={isAuthed ? "/dashboard" : "/"} />
          <Link
            href={isAuthed ? "/dashboard" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> {isAuthed ? "Tableau de bord" : "Accueil"}
          </Link>
        </div>
      </header>

      <main className="container-page space-y-6 py-10">
        {fromCredits && (
          <div className="flex items-center gap-3 rounded-2xl border border-coral-200 bg-coral-50 px-5 py-4 text-coral-900">
            <Sparkles className="h-5 w-5 shrink-0 text-coral-600" />
            <p className="text-sm font-medium">
              {searchParams.from === "4k"
                ? "La 4K est réservée au pack Pro et au-dessus — choisissez un pack ci-dessous."
                : "Rechargez vos crédits pour générer votre vidéo."}
            </p>
          </div>
        )}
        {searchParams.checkout === "cancel" && (
          <div className="rounded-xl border border-border bg-card px-5 py-3 text-center text-sm text-muted-foreground">
            Paiement annulé — aucun montant n&apos;a été débité.
          </div>
        )}

        {/* Top panels: balance + add credits */}
        <BillingTopPanel
          credits={credits}
          expiresAt={expiresAt}
          tier={tier}
          isAuthed={isAuthed}
        />

        {/* Automatic payments toggle */}
        {isAuthed && <AutoRefillToggle enabled={autoRefill} packId={autoRefillPack} />}

        {/* Transaction history */}
        {isAuthed && (
          <div className="card-base overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold text-ink">Historique des transactions</h2>
              {hasCustomer && (
                <PortalButton className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-ink transition hover:bg-muted">
                  <FileText className="h-3.5 w-3.5" /> Mes factures PDF
                </PortalButton>
              )}
            </div>

            {transactions.length > 0 ? (
              <div>
                <div className="hidden grid-cols-4 border-b border-border bg-muted/50 px-6 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Date &amp; Heure</span>
                  <span className="col-span-2">Description</span>
                  <span className="text-right">Montant</span>
                </div>
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="grid grid-cols-1 gap-0.5 px-6 py-3.5 sm:grid-cols-4 sm:items-center sm:gap-3"
                    >
                      <span className="text-xs text-muted-foreground">
                        {formatDateFR(tx.created_at)}
                      </span>
                      <span className="col-span-2 text-sm text-ink">
                        {REASON_LABELS[tx.reason] ?? tx.reason}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold sm:text-right",
                          tx.amount > 0 ? "text-green-600" : "text-ink",
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toLocaleString("fr-FR")} crédits
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Receipt className="h-6 w-6" />
                </span>
                <p className="font-medium text-ink">Aucune transaction pour le moment</p>
                <p className="text-sm text-muted-foreground">
                  Vos achats de crédits apparaîtront ici.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
