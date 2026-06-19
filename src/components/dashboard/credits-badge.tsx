import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreditsBadge({ credits, className }: { credits: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1.5 text-sm font-semibold text-coral-700",
        className,
      )}
      title="Crédits vidéo restants"
    >
      <Film className="h-4 w-4" />
      {credits} {credits > 1 ? "crédits" : "crédit"}
    </span>
  );
}
