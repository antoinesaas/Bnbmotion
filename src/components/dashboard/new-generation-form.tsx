"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, AlertCircle, Coins, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RoomPhotoUploader, type RoomGroup } from "./room-photo-uploader";
import {
  UPLOAD,
  DURATIONS,
  DURATION_LABELS,
  RESOLUTIONS,
  creditCost,
  canUse4K,
  type Resolution,
  type Duration,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NewGenerationForm({
  userId,
  credits,
  tier,
}: {
  userId: string;
  credits: number;
  tier: string;
}) {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [duration, setDuration] = useState<Duration>(15);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const has4K = canUse4K(tier);
  const cost = creditCost(resolution, duration);
  const enough = credits >= cost;

  const allRoomsValid =
    roomGroups.length >= UPLOAD.minRooms &&
    roomGroups.every((g) => g.files.length >= UPLOAD.minPhotosPerRoom);
  const totalPhotos = roomGroups.reduce((s, g) => s + g.files.length, 0);

  const canSubmit = enough && propertyName.trim().length > 0 && allRoomsValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (resolution === "4k" && !has4K) { router.push("/abonnement?from=4k"); return; }
    if (!enough) { router.push("/abonnement?from=credits"); return; }
    if (!allRoomsValid) {
      setError(`Ajoutez au moins ${UPLOAD.minRooms} pièce avec ${UPLOAD.minPhotosPerRoom} photos minimum.`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const batchId = crypto.randomUUID();
      let globalIdx = 0;

      const apiGroups: { room: string; promptLabel: string; paths: string[] }[] = [];

      for (const group of roomGroups) {
        const paths: string[] = [];
        for (const { file } of group.files) {
          setProgress(`Téléversement ${globalIdx + 1}/${totalPhotos}…`);
          const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "");
          const path = `${userId}/${batchId}/${String(globalIdx + 1).padStart(3, "0")}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("listings")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw new Error("Échec du téléversement. Réessayez.");
          paths.push(path);
          globalIdx++;
        }
        apiGroups.push({ room: group.label, promptLabel: group.promptLabel, paths });
      }

      setProgress("Analyse des pièces et génération du prompt…");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: propertyName.trim(),
          roomGroups: apiGroups,
          resolution,
          duration,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "no_credits") return router.push("/abonnement?from=credits");
        if (data.code === "need_pro") return router.push("/abonnement?from=4k");
        throw new Error(data.error || "Une erreur est survenue.");
      }

      roomGroups.forEach((g) => g.files.forEach((f) => URL.revokeObjectURL(f.url)));
      setRoomGroups([]);
      setPropertyName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="property_name">Nom de la propriété</Label>
        <Input
          id="property_name"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="Ex. Villa vue mer — Biarritz"
          maxLength={120}
          disabled={submitting}
        />
      </div>

      <div>
        <Label>
          Photos par pièce{" "}
          <span className="font-normal text-muted-foreground">
            ({UPLOAD.minPhotosPerRoom}–{UPLOAD.maxPhotosPerRoom} photos par pièce · {UPLOAD.maxRooms} pièces max)
          </span>
        </Label>
        <div className="mt-2">
          <RoomPhotoUploader groups={roomGroups} onChange={setRoomGroups} disabled={submitting} />
        </div>
      </div>

      <div>
        <Label>Durée de la vidéo</Label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              disabled={submitting}
              onClick={() => setDuration(d)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                duration === d
                  ? "border-coral-400 bg-coral-50 text-coral-700 ring-1 ring-coral-300"
                  : "border-border bg-white text-ink hover:bg-muted",
              )}
            >
              {DURATION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Qualité vidéo</Label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((r) => {
            const locked = r === "4k" && !has4K;
            const active = resolution === r && !locked;
            return (
              <button
                key={r}
                type="button"
                disabled={submitting}
                onClick={() => (locked ? router.push("/abonnement?from=4k") : setResolution(r))}
                className={cn(
                  "relative flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-coral-400 bg-coral-50 text-coral-700 ring-1 ring-coral-300"
                    : "border-border bg-white text-ink hover:bg-muted",
                  locked && "text-muted-foreground",
                )}
              >
                {r === "4k" ? "4K" : r}
                {locked && <Lock className="ml-1 inline h-3 w-3 align-middle" />}
              </button>
            );
          })}
        </div>
        {!has4K && (
          <p className="mt-1 text-xs text-muted-foreground">
            4K disponible dès le pack Pro (49,99 €).
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-sm text-ink">
          <Coins className="h-4 w-4 text-coral-500" />
          Coût : <strong>{cost.toLocaleString("fr-FR")} crédits</strong>
          <span className="text-muted-foreground">· solde {credits.toLocaleString("fr-FR")}</span>
        </p>
        {enough ? (
          <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
            {!submitting && <Wand2 className="h-4 w-4" />}
            {submitting ? progress || "Génération…" : "Générer ma vidéo"}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={() => router.push("/abonnement?from=credits")}>
            <Coins className="h-4 w-4" /> Acheter des crédits
          </Button>
        )}
      </div>

      <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-xs leading-relaxed text-amber-800">
        🧪 Outil encore en phase de test. Si un résultat ne vous convient pas, dites-le-nous
        juste après la génération : vos retours nous aident à l&apos;améliorer et nous pouvons
        vous rembourser les crédits concernés.
      </p>
    </form>
  );
}
