import OpenAI from "openai";
import type { KlingElement } from "@/lib/seedance";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

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

function sanitizeElementName(key: string, index: number): string {
  return `element_${index + 1}`;
}

function buildElements(roomGroups: RoomGroupInput[]): KlingElement[] {
  return roomGroups.map((rg, i) => ({
    name: sanitizeElementName(rg.room, i),
    description: rg.promptLabel,
    elementInputUrls: rg.imageUrls.slice(0, 4),
  }));
}

function fallbackPlan(
  propertyName: string,
  roomGroups: RoomGroupInput[],
  premium: boolean,
): WalkthroughPlan {
  const elements = buildElements(roomGroups);
  const startImageUrl = roomGroups[0].imageUrls[0];
  const endImageUrl = roomGroups.at(-1)!.imageUrls.at(-1)!;
  const orderedImageUrls = roomGroups.flatMap((rg) => rg.imageUrls);

  const elementRefs = elements.map((e) => `@${e.name}`).join(", ");
  const prompt = [
    `Cinematic FPV walkthrough of "${propertyName}".`,
    `Camera enters and flows through ${elementRefs}.`,
    `Each space: slow 1-second reveal, then fast speed ramp to the next room.`,
    premium
      ? "Cinematic 4K, film grain, HDR."
      : "Professional real-estate look, crisp and clean.",
    "Warm golden light, no people, no text, no watermark. 15 seconds.",
  ].join(" ");

  return { startImageUrl, endImageUrl, elements, orderedImageUrls, prompt };
}

const SYSTEM_PROMPT = `You are a luxury real-estate videographer writing prompts for Kling 3.0 AI video.

The room structure is pre-defined by the user. Your ONLY job: write a cinematic 15-second walkthrough prompt.

PROMPT FORMAT (follow exactly):
"Cinematic FPV walkthrough of [short property description]. Camera glides through [opening room — describe what is actually visible]. Slow 1-second reveal — @element_1 — [exact visual details of room 1: materials, colors, light]. Speed ramp → @element_2 — slow reveal — [exact visual details of room 2]. [Continue for each element]. Final glide — [end scene details]. [Quality tag]. No people, no text, no watermark. 15 seconds."

CAMERA RHYTHM (mandatory — do not omit):
- Room entry: "Slow 1-second reveal" or "slow reveal" — camera decelerates
- Room exit: "Speed ramp →" or "fast speed ramp" — motion blur transition
- Pattern repeats for every room

QUALITY TAG:
- 4K mode: "Cinematic 4K grading, rich HDR, film grain"
- Standard: "Professional real-estate photography look"

RULES:
- Use ONLY @element_1, @element_2, @element_3 — exact names, no variation
- Describe ONLY what is actually visible in the provided photos
- Be specific: "white Carrara marble island" not "nice kitchen"
- Maximum 200 words total
- Return only JSON: { "prompt": "..." }`;

function buildUserMessage(
  propertyName: string,
  roomGroups: RoomGroupInput[],
  premium: boolean,
): string {
  const roomList = roomGroups
    .map((rg, i) => `  @element_${i + 1} = ${rg.room} (${rg.imageUrls.length} photos)`)
    .join("\n");

  return `Property: "${propertyName}"
Video: 15 seconds, Kling 3.0, no audio, 16:9, ${premium ? "4K" : "Full HD"}

Room structure (pre-defined — do NOT re-identify):
${roomList}

Opening shot: first photo of "${roomGroups[0].room}"
Closing shot: last photo of "${roomGroups.at(-1)!.room}"

Photos are sent below in order: all photos of room 1 first, then room 2, etc.

Write the cinematic 15-second prompt. Return ONLY JSON: { "prompt": "..." }`;
}

/**
 * Planifie le walkthrough Kling 3.0 avec les pièces pré-classées par l'utilisateur.
 *
 * Les kling_elements sont construits directement depuis roomGroups.
 * GPT-4o-mini ne fait que rédiger le prompt (pas de détection de pièces).
 * Fallback silencieux si OpenAI est indisponible.
 */
export async function planWalkthrough(opts: {
  propertyName: string;
  roomGroups: RoomGroupInput[];
  premium?: boolean;
}): Promise<WalkthroughPlan> {
  const { propertyName, roomGroups, premium = false } = opts;
  const fallback = fallbackPlan(propertyName, roomGroups, premium);
  const key = process.env.OPENAI_API_KEY;

  if (!key || roomGroups.length === 0) return fallback;

  try {
    const client = new OpenAI({ apiKey: key });

    const allImageUrls = roomGroups.flatMap((rg) => rg.imageUrls);
    const userContent: OpenAI.ChatCompletionContentPart[] = [
      { type: "text", text: buildUserMessage(propertyName, roomGroups, premium) },
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

    const elements = buildElements(roomGroups);
    const startImageUrl = roomGroups[0].imageUrls[0];
    const endImageUrl = roomGroups.at(-1)!.imageUrls.at(-1)!;
    const orderedImageUrls = allImageUrls;

    return { startImageUrl, endImageUrl, elements, orderedImageUrls, prompt };
  } catch (e) {
    console.error("planWalkthrough (OpenAI) indisponible, fallback:", e);
    return fallback;
  }
}
