import Link from "next/link";
import { Download, Lock, AlertCircle, Film, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateFR } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Generation = Database["public"]["Tables"]["generations"]["Row"];

export function GenerationCard({ generation: g }: { generation: Generation }) {
  const photoCount = g.photo_paths?.length ?? 0;

  return (
    <div className="card-base flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      {/* Vignette */}
      <div className="relative grid aspect-video w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 sm:w-44">
        {g.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-stone-400">
            <Film className="h-6 w-6" />
            <span className="text-[11px]">{photoCount} photos</span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{g.property_name}</h3>
          <StatusBadge status={g.status} />
          {g.is_free_trial && (
            <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-medium text-coral-700">
              Essai gratuit
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDateFR(g.created_at)}
          {g.requested_seconds ? ` · ${g.requested_seconds}s` : ""}
        </p>

        {g.status === "failed" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {g.error_message || "La génération a échoué."} — votre crédit a été remboursé.
          </p>
        )}
        {(g.status === "pending" || g.status === "processing") && (
          <p className="mt-2 text-xs text-blue-600">
            Votre vidéo est en cours de génération. Vous serez notifié dès qu&apos;elle est prête.
          </p>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0">
        {g.status === "completed" && g.is_free_trial && (
          <Link
            href="/abonnement"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            <Lock className="h-4 w-4" />
            S&apos;abonner pour télécharger
          </Link>
        )}
        {g.status === "completed" && !g.is_free_trial && (
          <a
            href={`/api/generations/${g.id}/download`}
            className="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </a>
        )}
      </div>
    </div>
  );
}
