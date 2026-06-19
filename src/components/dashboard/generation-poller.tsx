"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Interroge périodiquement le statut des générations en cours et rafraîchit
 * la page dès qu'une vidéo est terminée ou échouée.
 */
export function GenerationPoller({ activeIds }: { activeIds: string[] }) {
  const router = useRouter();
  const idsRef = useRef<string[]>(activeIds);
  idsRef.current = activeIds;
  const key = activeIds.join(",");

  useEffect(() => {
    if (idsRef.current.length === 0) return;
    let cancelled = false;

    const tick = async () => {
      const ids = idsRef.current;
      if (ids.length === 0) return;
      try {
        const statuses = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/generations/${id}/status`, { cache: "no-store" });
            if (!res.ok) return null;
            const data = await res.json();
            return data.status as string;
          }),
        );
        if (!cancelled && statuses.some((s) => s === "completed" || s === "failed")) {
          router.refresh();
        }
      } catch {
        /* on retentera au prochain tick */
      }
    };

    const interval = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
