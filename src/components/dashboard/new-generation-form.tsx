"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type SelectedPhoto } from "./photo-uploader";
import { UPLOAD } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewGenerationForm({
  userId,
  credits,
  maxSeconds,
}: {
  userId: string;
  credits: number;
  maxSeconds: number;
}) {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const noCredits = credits < 1;
  const canSubmit =
    !noCredits &&
    propertyName.trim().length > 0 &&
    photos.length >= UPLOAD.minPhotos &&
    photos.length <= UPLOAD.maxPhotos &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
        body: JSON.stringify({ propertyName: propertyName.trim(), photoPaths: paths }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === "no_credits") {
          router.push("/abonnement");
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
          placeholder="Ex. Studio cosy vue mer — Biarritz"
          maxLength={120}
          disabled={submitting}
        />
      </div>

      <div>
        <Label>Photos du logement</Label>
        <PhotoUploader photos={photos} onChange={setPhotos} disabled={submitting} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {noCredits ? (
        <div className="rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
          Vous n&apos;avez plus de crédit.{" "}
          <a href="/abonnement" className="font-semibold underline">
            Rechargez pour générer une vidéo
          </a>
          .
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            La génération produira une vidéo d&apos;environ <strong>{maxSeconds} s</strong> et
            consommera <strong>1 crédit</strong> (remboursé en cas d&apos;échec).
          </p>
          <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
            {!submitting && <Wand2 className="h-4 w-4" />}
            {submitting ? progress || "Génération…" : "Générer ma vidéo"}
          </Button>
        </div>
      )}
    </form>
  );
}
