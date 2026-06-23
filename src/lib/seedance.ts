/**
 * Client de génération vidéo via kie.ai — modèle `gemini-omni-video`.
 * Accepte jusqu'à 7 images, résolutions 720p/1080p/4k, durées 4/6/8/10s.
 * Flux : createTask -> taskId -> (callback OU polling recordInfo) -> resultUrls.
 */

import type { Resolution, Duration } from "@/lib/constants";

const BASE = process.env.SEEDANCE_API_BASE ?? "https://api.kie.ai";
const MODEL = process.env.SEEDANCE_MODEL ?? "gemini-omni-video";

function apiKey(): string {
  const k = process.env.SEEDANCE_API_KEY;
  if (!k) throw new Error("SEEDANCE_API_KEY manquante.");
  return k;
}

export interface VideoTaskInput {
  prompt: string;
  /** 1 à 7 URLs d'images publiques. */
  imageUrls: string[];
  aspectRatio?: "16:9" | "9:16";
  resolution?: Resolution;
  duration: Duration;
  callbackUrl?: string;
}

export interface VideoTask {
  state: string;
  resultUrls: string[];
  failCode: string | null;
  failMsg: string | null;
  costTimeMs: number | null;
}

/** Crée une tâche de génération et renvoie le taskId. */
export async function createSeedanceTask(input: VideoTaskInput): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      ...(input.callbackUrl ? { callBackUrl: input.callbackUrl } : {}),
      input: {
        prompt: input.prompt,
        image_urls: input.imageUrls.slice(0, 7),
        aspect_ratio: input.aspectRatio ?? "16:9",
        resolution: input.resolution ?? "1080p",
        duration: String(input.duration),
      },
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok || json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(json?.msg || `Échec de création de la tâche vidéo (HTTP ${res.status}).`);
  }
  return json.data.taskId as string;
}

/** Récupère l'état d'une tâche (endpoint unifié recordInfo). */
export async function getSeedanceTask(taskId: string): Promise<VideoTask> {
  const res = await fetch(
    `${BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${apiKey()}` }, cache: "no-store" },
  );
  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok || json?.code !== 200) {
    throw new Error(json?.msg || `Échec de lecture de la tâche (HTTP ${res.status}).`);
  }

  const d = json.data ?? {};
  let resultUrls: string[] = [];
  if (d.resultJson) {
    try {
      resultUrls = JSON.parse(d.resultJson).resultUrls ?? [];
    } catch {
      /* ignore */
    }
  }

  return {
    state: d.state,
    resultUrls,
    failCode: d.failCode ?? null,
    failMsg: d.failMsg ?? null,
    costTimeMs: d.costTime ?? null,
  };
}

export function mapSeedanceState(state: string): "processing" | "completed" | "failed" {
  if (state === "success") return "completed";
  if (state === "fail") return "failed";
  return "processing";
}
