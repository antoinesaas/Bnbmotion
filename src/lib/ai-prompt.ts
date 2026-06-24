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
 * Fusionne N groupes de pièces en au maximum 3 kling_elements.
 * Si ≤ 3 pièces : mapping 1:1.
 * Si > 3 pièces : les pièces consécutives sont regroupées (ex. 5 pièces → 3 éléments).
 */
function mergeRoomsToElements(roomGroups: RoomGroupInput[]): KlingElement[] {
  if (roomGroups.length <= MAX_KLING_ELEMENTS) {
    return roomGroups.map((rg, i) => ({
      name: `element_${i + 1}`,
      description: rg.promptLabel,
      elementInputUrls: rg.imageUrls.slice(0, MAX_PHOTOS_PER_ELEMENT),
    }));
  }

  // Distribuire N pièces en 3 groupes de taille égale
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

const SYSTEM_PROMPT = `You are a luxury real-estate videographer writing prompts for Kling AI video.

The room structure is pre-defined by the user. Your ONLY job: write a cinematic walkthrough prompt.

PROMPT FORMAT (follow exactly):
"Cinematic FPV walkthrough of [short property description]. Camera glides into [opening room — actual visual details]. Slow reveal — @element_1 — [real details: materials, colors, light]. Speed ramp → @element_2 — slow reveal — [real details]. [Continue for each element]. Final glide — [closing scene details]. [Quality tag]. No people, no text, no watermark. [N] seconds."

CAMERA RHYTHM (mandatory):
- Room entry: "Slow reveal" or "slow 1-second reveal" — camera decelerates
- Room exit: "Speed ramp →" — fast motion blur transition
- For SHORT videos (5s): minimal reveals, focus on speed and energy
- For MEDIUM videos (10s): 1-2 reveals with good transitions
- For LONG videos (15s): full slow-reveal treatment for every room

QUALITY:
- 4K: "Cinematic 4K grading, rich HDR, film grain"
- Standard: "Professional real-estate photography look"

RULES:
- Use ONLY @element_1, @element_2, @element_3 exactly
- Describe ONLY what is actually visible in the photos provided
- Specific details: "white Carrara marble island" not "nice kitchen"
- Return only JSON: { "prompt": "..." }`;

function buildUserMessage(
  propertyName: string,
  roomGroups: RoomGroupInput[],
  elements: KlingElement[],
  duration: number,
  premium: boolean,
): string {
  const roomList = elements
    .map((el, i) => `  @${el.name} = ${el.description}`)
    .join("\n");

  const totalRooms = roomGroups.length;
  const mergedNote = totalRooms > MAX_KLING_ELEMENTS
    ? ` (${totalRooms} rooms merged into ${elements.length} elements)` : "";

  return `Property: "${propertyName}"
Video: ${duration} seconds, Kling AI, no audio, 16:9, ${premium ? "4K" : "Full HD"}${mergedNote}

Element reference${mergedNote}:
${roomList}

Opening: first photo of "${roomGroups[0].room}"
Closing: last photo of "${roomGroups.at(-1)!.room}"

Photos sent below in room order.
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

    const userContent: OpenAI.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: buildUserMessage(propertyName, roomGroups, elements, duration, premium),
      },
      ...allImageUrls.map(
        (url): OpenAI.ChatCompletionContentPart => ({
          type: "image_url",
          image_url: { url, detail: "low" },
        }),
      ),
    ];

    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { prompt?: string };
    const prompt =
      typeof parsed.prompt === "string" && parsed.prompt.length > 40
        ? parsed.prompt
        : fallback.prompt;

    const startImageUrl = roomGroups[0].imageUrls[0];
    const endImageUrl = roomGroups.at(-1)!.imageUrls.at(-1)!;
    const orderedImageUrls = allImageUrls;

    return { startImageUrl, endImageUrl, elements, orderedImageUrls, prompt };
  } catch (e) {
    console.error("planWalkthrough (OpenAI) indisponible, fallback:", e);
    return fallback;
  }
}
