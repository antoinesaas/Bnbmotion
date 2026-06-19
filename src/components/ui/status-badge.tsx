import { cn } from "@/lib/utils";
import { GENERATION_STATUS_LABELS } from "@/lib/constants";

const toneStyles: Record<string, { wrap: string; dot: string; pulse?: boolean }> = {
  muted: { wrap: "bg-stone-100 text-stone-600", dot: "bg-stone-400" },
  info: { wrap: "bg-blue-50 text-blue-700", dot: "bg-blue-500", pulse: true },
  success: { wrap: "bg-green-50 text-green-700", dot: "bg-green-500" },
  error: { wrap: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = GENERATION_STATUS_LABELS[status] ?? { label: status, tone: "muted" };
  const tone = toneStyles[meta.tone] ?? toneStyles.muted;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone.wrap,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {tone.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              tone.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tone.dot)} />
      </span>
      {meta.label}
    </span>
  );
}
