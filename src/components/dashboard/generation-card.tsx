import { Download, AlertCircle, Film, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateFR } from "@/lib/utils";
import { RESOLUTION_LABELS, type Resolution } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type Generation = Database["public"]["Tables"]["generations"]["Row"];

export function GenerationCard({
  generation: g,
  videoUrl,
}: {
  generation: Generation;
  videoUrl?: string | null;
}) {
  if (g.status === "completed" && videoUrl) {
    return (
      <div className="card-base overflow-hidden">
        <video src={videoUrl} controls playsInline className="aspect-video w-full bg-black" />
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-ink">{g.property_name}</h3>
              <StatusBadge status={g.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDateFR(g.created_at)} · {g.requested_seconds}s ·{" "}
              {RESOLUTION_LABELS[g.resolution as Resolution] ?? g.resolution}
            </p>
          </div>
          <a
            href={`/api/generations/${g.id}/download`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base flex items-center gap-4 p-4">
      <div className="grid aspect-video w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 text-stone-400">
        <Film className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{g.property_name}</h3>
          <StatusBadge status={g.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDateFR(g.created_at)}
        </p>
        {g.status === "failed" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {g.error_message || "La génération a échoué."} — vos crédits ont été remboursés.
          </p>
        )}
        {(g.status === "pending" || g.status === "processing") && (
          <p className="mt-2 text-xs text-blue-600">
            Génération en cours… (≈ 1 à 3 min). Cette page se met à jour automatiquement.
          </p>
        )}
      </div>
    </div>
  );
}
