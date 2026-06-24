import OpenAI from "openai";
import type { KlingElement } from "@/lib/seedance";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface WalkthroughPlan {
  /** Premier frame exact de la vidéo (URL de la photo d'entrée/extérieur) */
  startImageUrl: string;
  /** Dernier frame exact (URL de la meilleure vue finale — piscine, terrasse…) */
  endImageUrl: string;
  /** Jusqu'à 3 groupes de pièces référencés dans le prompt via @name */
  elements: KlingElement[];
  /** Toutes les URLs dans l'ordre du walkthrough (pour référence) */
  orderedImageUrls: string[];
  /** Prompt complet à envoyer à Kling 3.0 */
  prompt: string;
}

/** Prompt de repli quand OpenAI n'est pas disponible. */
function fallbackPlan(
  propertyName: string,
  imageUrls: string[],
  premium: boolean,
): WalkthroughPlan {
  const startImageUrl = imageUrls[0];
  const endImageUrl = imageUrls[imageUrls.length - 1];
  const midUrls = imageUrls.slice(1, -1);

  const elements: KlingElement[] = [];
  if (midUrls.length >= 2) {
    elements.push({
      name: "element_rooms",
      description: "interior rooms of the property",
      elementInputUrls: midUrls.slice(0, 4),
    });
  }

  const elemRef = elements.length > 0 ? ", moving through @element_rooms" : "";
  const prompt = [
    `Smooth FPV walkthrough of "${propertyName}".`,
    `Camera enters the property and glides forward${elemRef}.`,
    `Each space: slow 1-second reveal of the real decor, then fast speed ramp to the next room.`,
    premium
      ? "Ultra-luxury real-estate, cinematic color grading, HDR."
      : "Professional real-estate videography, crisp clean look.",
    "Warm natural golden light, no people, no text, no watermark. 15 seconds total.",
  ].join(" ");

  return { startImageUrl, endImageUrl, elements, orderedImageUrls: imageUrls, prompt };
}

const SYSTEM_PROMPT = `You are a world-class real-estate videography director specializing in the Kling 3.0 AI video model.

Kling 3.0 features you MUST use:
- image_urls[0] = exact first video frame (start of the walkthrough)
- image_urls[1] = exact last video frame (end of the walkthrough — the "wow" finale)
- kling_elements = reference groups, each with 2–4 photos of the same space, referenced in the prompt via @element_name

Your job when given N photos of a property:
1. Identify each photo: which room/space it shows, key visual details (materials, colors, style)
2. Group photos by space (2–4 per group), create up to 3 element groups for the MIDDLE rooms
3. Pick the best start frame: entrance, exterior facade, or most impressive opening shot
4. Pick the best end frame: pool, terrace, panoramic view, or best "wow" final shot
5. Write a cinematic 15-second walkthrough prompt following EXACTLY this format

PROMPT FORMAT (follow strictly):
"[One-sentence property description based on actual photos]. Camera enters from [start description]. Slow 1-second reveal — [detail what is actually visible]. Speed ramp → @element_X — slow reveal — [actual visual details from photos]. Speed ramp → @element_Y — slow reveal — [actual visual details]. Final speed ramp → [end frame description — actual details visible]. [Quality tag]. No people, no text, no watermark. 15 seconds."

CAMERA RULES (mandatory):
- Every room entry: camera SLOWS for exactly 1 second to reveal the space
- Every room exit: FAST speed ramp to the next space (motion blur)
- This rhythm is non-negotiable: slow reveal → fast exit → slow reveal → fast exit
- The start and end frames are literal photos — describe what is actually in those photos

ELEMENT RULES:
- Element name format: element_1, element_2, element_3 (max 3)
- Each element = one room or area with 2–4 photos showing it
- description = brief English label of the space (e.g. "open-plan living room with oak floors")
- Must use element names that exactly match the @element_name in the prompt
- Each @element costs 37 characters; max 500 chars per prompt section

QUALITY RULES:
- Describe ONLY what is actually visible in the photos — never invent details
- Be specific: "white Carrara marble kitchen island" not just "nice kitchen"
- Premium = "Cinematic 4K grading, film grain, HDR" / Standard = "Professional real-estate photography look"
- Maximum 250 words for the full prompt`;

function buildUserMessage(propertyName: string, count: number, premium: boolean): string {
  return `You have ${count} reference photos of the property "${propertyName}" (uploaded in order, indexed 0 to ${count - 1}).

Analyze every photo carefully — identify the exact space, describe 3–5 real visual details.

Then respond with ONLY valid JSON (no markdown, no explanation):
{
  "startIndex": <index of best start frame — entrance or impressive opener>,
  "endIndex": <index of best end frame — pool/terrace/view or best finale>,
  "elements": [
    {
      "name": "element_1",
      "description": "<English label of this space>",
      "indices": [<2–4 photo indices showing this space>]
    }
  ],
  "prompt": "<full 15-second walkthrough prompt using @element_1, @element_2, etc.>"
}

IMPORTANT:
- elements array: 0 to 3 items, each with 2–4 indices, describing MIDDLE rooms (not start/end)
- If the property has ≤3 photos: use startIndex=0, endIndex=${count - 1}, elements=[]
- The prompt MUST use the exact camera rhythm: slow reveal → speed ramp for EVERY transition
- Describe what is ACTUALLY in the photos — premium mode: ${premium}`;
}

/**
 * Utilise GPT-4o-mini vision pour :
 *  1) Identifier et grouper les photos par pièce
 *  2) Choisir le start frame et end frame optimaux
 *  3) Créer les kling_elements (groupes de photos par pièce)
 *  4) Écrire un prompt cinématographique précis avec @element references
 *
 * Fallback silencieux → prompt statique si OpenAI est indisponible.
 */
export async function planWalkthrough(opts: {
  propertyName: string;
  imageUrls: string[];
  premium?: boolean;
}): Promise<WalkthroughPlan> {
  const { propertyName, imageUrls, premium = false } = opts;
  const fallback = fallbackPlan(propertyName, imageUrls, premium);
  const key = process.env.OPENAI_API_KEY;

  if (!key || imageUrls.length === 0) return fallback;

  try {
    const client = new OpenAI({ apiKey: key });

    const userContent: OpenAI.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: buildUserMessage(propertyName, imageUrls.length, premium),
      },
      ...imageUrls.map(
        (url): OpenAI.ChatCompletionContentPart => ({
          type: "image_url",
          image_url: { url, detail: "low" },
        }),
      ),
    ];

    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      startIndex?: number;
      endIndex?: number;
      elements?: { name: string; description: string; indices: number[] }[];
      prompt?: string;
    };

    const startIdx = Number(parsed.startIndex ?? 0);
    const endIdx = Number(parsed.endIndex ?? imageUrls.length - 1);
    const startImageUrl = imageUrls[startIdx] ?? imageUrls[0];
    const endImageUrl = imageUrls[endIdx] ?? imageUrls[imageUrls.length - 1];

    const elements: KlingElement[] = [];
    if (Array.isArray(parsed.elements)) {
      for (const el of parsed.elements.slice(0, 3)) {
        if (!el.name || !Array.isArray(el.indices) || el.indices.length < 2) continue;
        const urls = el.indices
          .map((i: number) => imageUrls[i])
          .filter(Boolean)
          .slice(0, 4);
        if (urls.length < 2) continue;
        elements.push({
          name: el.name,
          description: el.description ?? el.name,
          elementInputUrls: urls,
        });
      }
    }

    // Reconstruct ordered walkthrough
    const usedIndices = new Set<number>([startIdx, endIdx]);
    const elementIndices = parsed.elements?.flatMap((e) => e.indices ?? []) ?? [];
    const ordered: string[] = [startImageUrl];
    for (const idx of elementIndices) {
      const url = imageUrls[idx];
      if (url && !usedIndices.has(idx)) {
        ordered.push(url);
        usedIndices.add(idx);
      }
    }
    ordered.push(endImageUrl);

    const prompt =
      typeof parsed.prompt === "string" && parsed.prompt.length > 40
        ? parsed.prompt
        : fallback.prompt;

    return { startImageUrl, endImageUrl, elements, orderedImageUrls: ordered, prompt };
  } catch (e) {
    console.error("planWalkthrough (OpenAI) unavailable, falling back:", e);
    return fallback;
  }
}
