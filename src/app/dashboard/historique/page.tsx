import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, cn } from "@/lib/utils";
import { PortalButton } from "@/components/billing/checkout-buttons";

export const metadata: Metadata = { title: "Historique & factures" };

const REASON_LABELS: Record<string, string> = {
  signup_bonus: "Bonus de bienvenue",
  credit_pack: "Achat de crédits",
  generation: "Génération vidéo",
  refund: "Remboursement (échec)",
  auto_refill: "Recharge automatique",
  admin_adjustment: "Ajustement",
};

export default async function HistoriquePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: txs }, { data: profile }] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single(),
  ]);
  const list = txs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Tableau de bord
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">Historique & factures</h1>
        </div>
        {profile?.stripe_customer_id && (
          <PortalButton className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-muted">
            <FileText className="h-4 w-4" /> Télécharger mes factures (PDF)
          </PortalButton>
        )}
      </div>

      {list.length > 0 ? (
        <div className="card-base divide-y divide-border">
          {list.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink">{REASON_LABELS[tx.reason] ?? tx.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDateFR(tx.created_at)}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  tx.amount > 0 ? "text-green-600" : "text-ink",
                )}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString("fr-FR")} crédits
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-base flex flex-col items-center justify-center gap-2 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="h-6 w-6" />
          </span>
          <p className="font-medium text-ink">Aucune transaction pour le moment</p>
        </div>
      )}
    </div>
  );
}
