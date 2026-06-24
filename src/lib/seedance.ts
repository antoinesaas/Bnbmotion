/**
 * Client de génération vidéo via kie.ai — modèle `kling-3.0/video`.
 * Single-shot mode : start_frame + end_frame + kling_elements (référence pièces).
 * Résolutions : std (720p) / pro (1080p) / 4K — durée fixe 15s — sans audio.
 */

import type { KlingMode } from "@/lib/constants";

const BASE = process.env.SEEDANCE_API_BASE ?? "https://api.kie.ai";
const MODEL = process.env.SEEDANCE_MODEL ?? "kling-3.0/video";

function apiKey(): string {
  const k = process.env.SEEDANCE_API_KEY;
  if (!k) throw new Error("SEEDANCE_API_KEY manquante.");
  return k;
}

export interface KlingElement {
  /** Identifiant court utilisé dans le prompt via @name */
  name: string;
  /** Description textuelle de la pièce (pour le modèle) */
  description: string;
  /** 2 à 4 URLs d'images publiques de cette pièce */
  elementInputUrls: string[];
}

export interface VideoTaskInput {
  prompt: string;
  /** URL de la première image (premier frame exact de la vidéo) */
  startImageUrl: string;
  /** URL de la dernière image (dernier frame exact de la vidéo) — optionnelle */
  endImageUrl?: string;
  /** Groupes de photos de pièces (max 3, limite API Kling) référencées via @name */
  klingElements?: KlingElement[];
  mode: KlingMode;
  /** Durée en secondes (5, 10 ou 15) — défaut 15 */
  duration?: number;
  aspectRatio?: "16:9" | "9:16";
  callbackUrl?: string;
}

export interface VideoTask {
  state: string;
  resultUrls: string[];
  failCode: string | null;
  failMsg: string | null;
  costTimeMs: number | null;
}

/** Crée une tâche Kling 3.0 et renvoie le taskId. */
export async function createSeedanceTask(input: VideoTaskInput): Promise<string> {
  const hasElements = (input.klingElements?.length ?? 0) > 0;

  const klingInput: Record<string, unknown> = {
    prompt: input.prompt,
    duration: input.duration ?? 15,
    aspect_ratio: input.aspectRatio ?? "16:9",
    mode: input.mode,
  };

  // image_urls (start + end frame) uniquement sans éléments — évite le conflit Kling 3.0
  if (!hasElements) {
    const imageUrls = [input.startImageUrl];
    if (input.endImageUrl) imageUrls.push(input.endImageUrl);
    klingInput.image_urls = imageUrls;
  }

  if (hasElements) {
    klingInput.kling_elements = input.klingElements!.map((el) => ({
      name: el.name,
      description: el.description,
      element_input_urls: el.elementInputUrls.slice(0, 4),
    }));
  }

  const body: Record<string, unknown> = { model: MODEL, input: klingInput };
  if (input.callbackUrl) body.callBackUrl = input.callbackUrl;

  const res = await fetch(`${BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok || json?.code !== 200 || !json?.data) {
    throw new Error((json?.msg as string) || `Échec de création de la tâche vidéo (HTTP ${res.status}).`);
  }
  return ((json.data as Record<string, unknown>).taskId as string);
}

/** Récupère l'état d'une tâche (endpoint unifié recordInfo). */
export async function getSeedanceTask(taskId: string): Promise<VideoTask> {
  const res = await fetch(
    `${BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${apiKey()}` }, cache: "no-store" },
  );
  const json = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok || json?.code !== 200) {
    throw new Error((json?.msg as string) || `Échec de lecture de la tâche (HTTP ${res.status}).`);
  }

  const d = (json.data ?? {}) as Record<string, unknown>;
  let resultUrls: string[] = [];
  if (d.resultJson) {
    try {
      resultUrls = (JSON.parse(d.resultJson as string) as { resultUrls?: string[] }).resultUrls ?? [];
    } catch {
      /* ignore */
    }
  }

  return {
    state: d.state as string,
    resultUrls,
    failCode: (d.failCode as string | null) ?? null,
    failMsg: (d.failMsg as string | null) ?? null,
    costTimeMs: (d.costTime as number | null) ?? null,
  };
}

export function mapSeedanceState(state: string): "processing" | "completed" | "failed" {
  if (state === "success") return "completed";
  if (state === "fail") return "failed";
  return "processing";
}
