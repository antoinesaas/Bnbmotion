/**
 * Client Seedance 1.5 Pro via kie.ai.
 * Flux : createTask -> taskId -> (callback OU polling recordInfo) -> resultUrls.
 * Doc : POST /api/v1/jobs/createTask, GET /api/v1/jobs/recordInfo?taskId=...
 */

const BASE = process.env.SEEDANCE_API_BASE ?? "https://api.kie.ai";
const MODEL = process.env.SEEDANCE_MODEL ?? "bytedance/seedance-1.5-pro";

function apiKey(): string {
  const k = process.env.SEEDANCE_API_KEY;
  if (!k) throw new Error("SEEDANCE_API_KEY manquante.");
  return k;
}

export type SeedanceState = "waiting" | "queuing" | "generating" | "success" | "fail" | string;

export interface SeedanceInput {
  prompt: string;
  /** 0 à 2 URLs d'images publiques (Seedance accepte au plus 2 images). */
  imageUrls?: string[];
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
  resolution?: "480p" | "720p" | "1080p";
  /** 4 à 12, pas de 2. */
  duration?: number;
  fixedLens?: boolean;
  generateAudio?: boolean;
  callbackUrl?: string;
}

export interface SeedanceTask {
  state: SeedanceState;
  resultUrls: string[];
  failCode: string | null;
  failMsg: string | null;
  costTimeMs: number | null;
}

/** Crée une tâche de génération et renvoie le taskId. */
export async function createSeedanceTask(input: SeedanceInput): Promise<string> {
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
        input_urls: (input.imageUrls ?? []).slice(0, 2),
        aspect_ratio: input.aspectRatio ?? "16:9",
        resolution: input.resolution ?? "720p",
        duration: input.duration ?? 8,
        fixed_lens: input.fixedLens ?? false,
        generate_audio: input.generateAudio ?? false,
        nsfw_checker: false,
      },
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok || json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(json?.msg || `Échec de création de la tâche Seedance (HTTP ${res.status}).`);
  }
  return json.data.taskId as string;
}

/** Récupère l'état d'une tâche. */
export async function getSeedanceTask(taskId: string): Promise<SeedanceTask> {
  const res = await fetch(
    `${BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${apiKey()}` }, cache: "no-store" },
  );
  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok || json?.code !== 200) {
    throw new Error(json?.msg || `Échec de lecture de la tâche Seedance (HTTP ${res.status}).`);
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

/** Normalise l'état Seedance vers nos statuts internes. */
export function mapSeedanceState(state: SeedanceState): "processing" | "completed" | "failed" {
  if (state === "success") return "completed";
  if (state === "fail") return "failed";
  return "processing";
}
