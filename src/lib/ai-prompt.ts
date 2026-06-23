import OpenAI from "openai";
import { buildVideoPrompt } from "@/lib/prompt";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface WalkthroughPlan {
  imageUrls: string[];
  prompt: string;
}

/**
 * Utilise l'API OpenAI (vision) pour :
 *  1) ordonner les photos dans l'ordre naturel d'une visite (extérieur/entrée
 *     -> pièces de vie -> chambres -> extérieur/piscine),
 *  2) écrire le prompt FPV walkthrough parfait pour le modèle vidéo.
 * Repli sur le prompt statique + l'ordre d'origine si la clé est absente
 * ou en cas d'erreur. Critique : zéro vidéo ratée.
 */
export async function planWalkthrough(opts: {
  propertyName: string;
  imageUrls: string[];
  duration: number;
  premium?: boolean;
}): Promise<WalkthroughPlan> {
  const fallback = buildVideoPrompt({
    propertyName: opts.propertyName,
    seconds: opts.duration,
    premium: opts.premium,
  });
  const key = process.env.OPENAI_API_KEY;
  if (!key || opts.imageUrls.length === 0) {
    return { imageUrls: opts.imageUrls, prompt: fallback };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const content: any[] = [
      {
        type: "text",
        text:
          `These are ${opts.imageUrls.length} photos of a property named "${opts.propertyName}", in arbitrary order. ` +
          "1) Reorder them into the most natural visiting sequence: exterior/entrance first, then living spaces room by room (living room, dining, kitchen, hallway, staircase), then bedrooms and bathrooms, ending with outdoor/terrace/pool. " +
          "2) Write ONE cinematic English prompt (max 110 words) for an AI image-to-video model that performs a single continuous smooth FPV walkthrough following that exact order: calm, slow, deliberate gliding camera with gentle accelerations between rooms, warm golden-hour light, photorealistic, ultra-stable, no text, no captions, no people, no distortion. " +
          `Target duration about ${opts.duration} seconds. ` +
          'Respond ONLY with strict JSON: {"order":[zero-based indices in the new order],"prompt":"..."}.',
      },
      ...opts.imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");

    let ordered = opts.imageUrls;
    if (Array.isArray(parsed.order) && parsed.order.length > 0) {
      const seen = new Set<string>();
      const reordered: string[] = [];
      for (const i of parsed.order) {
        const u = opts.imageUrls[i];
        if (u && !seen.has(u)) {
          seen.add(u);
          reordered.push(u);
        }
      }
      for (const u of opts.imageUrls) if (!seen.has(u)) reordered.push(u);
      if (reordered.length === opts.imageUrls.length) ordered = reordered;
    }

    const prompt =
      typeof parsed.prompt === "string" && parsed.prompt.length > 20 ? parsed.prompt : fallback;

    return { imageUrls: ordered, prompt };
  } catch (e) {
    console.error("planWalkthrough (OpenAI) indisponible, repli statique:", e);
    return { imageUrls: opts.imageUrls, prompt: fallback };
  }
}
