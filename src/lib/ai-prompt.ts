import OpenAI from "openai";
import type { KlingElement } from "@/lib/seedance";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_KLING_ELEMENTS = 3;
const MAX_PHOTOS_PER_ELEMENT = 4;

export interface WalkthroughPlan {
  startImageUrl: string;
  endImageUrl: string;
  elements: KlingElement[];
  orderedImageUrls: string[];
  prompt: string;
}

export interface RoomGroupInput {
  room: string;        // French label (e.g. "Salon / Séjour")
  promptLabel: string; // English label for GPT (e.g. "living and dining room")
  imageUrls: string[];
}

/**
 * Kling limite à 3 kling_elements max.
 * ≤ 3 pièces : mapping 1:1. > 3 pièces : fusion en 3 groupes équilibrés.
 */
function mergeRoomsToElements(roomGroups: RoomGroupInput[]): KlingElement[] {
  if (roomGroups.length <= MAX_KLING_ELEMENTS) {
    return roomGroups.map((rg, i) => ({
      name: `element_${i + 1}`,
      description: rg.promptLabel,
      elementInputUrls: rg.imageUrls.slice(0, MAX_PHOTOS_PER_ELEMENT),
    }));
  }
  const elements: KlingElement[] = [];
  const chunkSize = Math.ceil(roomGroups.length / MAX_KLING_ELEMENTS);
  for (let i = 0; i < MAX_KLING_ELEMENTS; i++) {
    const slice = roomGroups.slice(i * chunkSize, (i + 1) * chunkSize);
    if (slice.length === 0) break;
    elements.push({
      name: `element_${i + 1}`,
      description: slice.map((r) => r.promptLabel).join(" and "),
      elementInputUrls: slice.flatMap((r) => r.imageUrls).slice(0, MAX_PHOTOS_PER_ELEMENT),
    });
  }
  return elements;
}

function fallbackPlan(
  propertyName: string,
  roomGroups: RoomGroupInput[],
  duration: number,
  premium: boolean,
): WalkthroughPlan {
  const elements = mergeRoomsToElements(roomGroups);
  const startImageUrl = roomGroups[0].imageUrls[0];
  const endImageUrl = roomGroups.at(-1)!.imageUrls.at(-1)!;
  const orderedImageUrls = roomGroups.flatMap((rg) => rg.imageUrls);

  const elementRefs = elements.map((e) => `@${e.name}`).join(", ");
  const prompt = [
    `Cinematic FPV walkthrough of "${propertyName}".`,
    `Camera enters and flows through ${elementRefs}.`,
    `Each space: slow reveal, then fast speed ramp to the next.`,
    premium ? "Cinematic 4K, film grain, HDR." : "Professional real-estate look, crisp and clean.",
    `No people, no text, no watermark. ${duration} seconds.`,
  ].join(" ");

  return { startImageUrl, endImageUrl, elements, orderedImageUrls, prompt };
}

const SYSTEM_PROMPT = `You are a cinematographer directing a Kling AI real-estate video.

The actual room photos are given to the video model separately as @element_1, @element_2, … — the model ALREADY SEES them. Therefore you must NOT describe what is in the rooms: no objects, furniture, materials, colors, light, or layout. Your ONLY job is to choreograph the CAMERA.

Write ONE continuous prompt that:
- Visits the elements in the EXACT order given, each referenced as @element_N.
- Gives each space and each transition a specific camera move (glide, dolly-in, push-in, crane up, low travel, gentle orbit, speed-ramp, whip-pan).
- Matches the rhythm to the duration:
  • 5s  → fast and energetic: quick push-ins, snappy speed-ramps, little dwell.
  • 10s → balanced: one smooth reveal per space, clean ramps between them.
  • 15s → cinematic: slow elegant dolly reveals on every space, flowing transitions.
- Ends on a closing camera move.
- Finishes with the quality tag, then "No people, no text, no watermark. [N] seconds."

Use each element's room TYPE only to pick a fitting camera move (e.g. pool/terrace/exterior → low gliding travel or crane up; bedroom → soft slow push-in; kitchen → lateral dolly), NEVER to describe its contents.

QUALITY TAG: 4K → "Cinematic 4K grading, rich HDR". Standard → "Crisp professional real-estate look".

Return ONLY JSON: { "prompt": "..." } — camera direction only, zero scene description.`;

function buildUserMessage(
  propertyName: string,
  elements: KlingElement[],
  duration: number,
  premium: boolean,
): string {
  const orderedList = elements
    .map((el, i) => `  ${i + 1}. @${el.name} — room type: ${el.description}`)
    .join("\n");

  return `Property: "${propertyName}"
Video: ${duration} seconds, 16:9, no audio, ${premium ? "4K" : "Full HD"}

Visit these elements in THIS exact order. Choreograph one camera move + transition for each — do NOT describe their contents:
${orderedList}

Open on @${elements[0].name}, close on @${elements.at(-1)!.name}.
Return ONLY JSON: { "prompt": "..." }`;
}

/**
 * Planifie le walkthrough Kling avec les pièces pré-classées par l'utilisateur.
 * Si l'utilisateur a ajouté plus de 3 pièces, elles sont fusionnées en 3 kling_elements.
 * GPT-4o-mini rédige uniquement le prompt (pas de détection de pièces).
 */
export async function planWalkthrough(opts: {
  propertyName: string;
  roomGroups: RoomGroupInput[];
  duration?: number;
  premium?: boolean;
}): Promise<WalkthroughPlan> {
  const { propertyName, roomGroups, duration = 15, premium = false } = opts;
  const fallback = fallbackPlan(propertyName, roomGroups, duration, premium);
  const key = process.env.OPENAI_API_KEY;

  if (!key || roomGroups.length === 0) return fallback;

  const elements = mergeRoomsToElements(roomGroups);

  try {
    const client = new OpenAI({ apiKey: key });
    const allImageUrls = roomGroups.flatMap((rg) => rg.imageUrls);

    // Pas d'images envoyées à GPT : Kling reçoit déjà les photos en kling_elements
    // et les « voit ». GPT ne fait que chorégraphier la caméra à partir du type de
    // pièce et de l'ordre — c'est plus fidèle, plus rapide et bien moins coûteux.
    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(propertyName, elements, duration, premium) },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { prompt?: string };
    let prompt =
      typeof parsed.prompt === "string" && parsed.prompt.length > 40
        ? parsed.prompt
        : fallback.prompt;

    // Garde-fou : chaque kling_element DOIT être référencé via @name dans le prompt,
    // sinon Kling ignore les photos associées. Si GPT en oublie, on ré-ancre tout.
    const missing = elements.filter((el) => !prompt.includes(`@${el.name}`));
    if (missing.length > 0) {
      const flow = elements.map((el) => `@${el.name}`).join(" → ");
      prompt += ` Camera flows through ${flow}, each space revealed in order.`;
    }

    const startImageUrl = roomGroups[0].imageUrls[0];
    const endImageUrl = roomGroups.at(-1)!.imageUrls.at(-1)!;
    const orderedImageUrls = allImageUrls;

    return { startImageUrl, endImageUrl, elements, orderedImageUrls, prompt };
  } catch (e) {
    console.error("planWalkthrough (OpenAI) indisponible, fallback:", e);
    return fallback;
  }
}
