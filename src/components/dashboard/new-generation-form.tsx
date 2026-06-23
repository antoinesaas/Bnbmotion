"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, AlertCircle, Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type SelectedPhoto } from "./photo-uploader";
import {
  UPLOAD,
  RESOLUTIONS,
  DURATIONS,
  creditCost,
  type Resolution,
  type Duration,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NewGenerationForm({ userId, credits }: { userId: string; credits: number }) {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [duration, setDuration] = useState<Duration>(8);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cost = creditCost(resolution, duration);
  const enough = credits >= cost;
  const canSubmit =
    enough &&
    propertyName.trim().length > 0 &&
    photos.length >= UPLOAD.minPhotos &&
    photos.length <= UPLOAD.maxPhotos &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enough) {
      router.push("/abonnement?from=credits");
      return;
    }
    if (photos.length < UPLOAD.minPhotos) {
      setError(`Ajoutez au moins ${UPLOAD.minPhotos} photos.`);
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const batchId = crypto.randomUUID();
      const paths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Téléversement des photos ${i + 1}/${photos.length}…`);
        const file = photos[i].file;
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${userId}/${batchId}/${String(i + 1).padStart(2, "0")}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listings")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error("Échec du téléversement d'une photo. Réessayez.");
        paths.push(path);
      }

      setProgress("Lancement de la génération…");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyName: propertyName.trim(), photoPaths: paths, resolution, duration }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "no_credits") {
          router.push("/abonnement?from=credits");
          return;
        }
        throw new Error(data.error || "Une erreur est survenue lors de la génération.");
      }

      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
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
        <Label>Photos du logement (une par pièce pour le walkthrough)</Label>
        <PhotoUploader photos={photos} onChange={setPhotos} disabled={submitting} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Qualité</Label>
          <div className="flex gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r}
                type="button"
                disabled={submitting}
                onClick={() => setResolution(r)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  resolution === r
                    ? "border-coral-400 bg-coral-50 text-coral-700 ring-1 ring-coral-300"
                    : "border-border bg-white text-ink hover:bg-muted",
                )}
              >
                {r === "4k" ? "4K" : r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Durée</Label>
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
                {d}s
              </button>
            ))}
          </div>
        </div>
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
          <span className="text-muted-foreground">
            · solde {credits.toLocaleString("fr-FR")}
          </span>
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
    </form>
  );
}
