import Anthropic from "@anthropic-ai/sdk";
import { buildVideoPrompt, type PromptOptions } from "@/lib/prompt";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

/**
 * Génère, via l'API Claude, un prompt vidéo cinématographique de type
 * « walkthrough immobilier » (traversée des pièces, accélérations,
 * rendu vidéaste). Repli automatique sur le prompt statique si la clé
 * ANTHROPIC_API_KEY est absente ou en cas d'erreur.
 */
export async function buildWalkthroughPrompt(opts: PromptOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildVideoPrompt(opts);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "You are a professional cinematographer writing a prompt for an AI image-to-video model (Seedance) that animates a real-estate photo. " +
        "Output ONLY the final English prompt — no preamble, no quotes. " +
        "Describe a smooth cinematic WALKTHROUGH of the home: a drone-like fly-through that glides forward through the interior, " +
        "with subtle accelerations and decelerations, elegant travelling, gentle parallax and depth, revealing the living spaces naturally. " +
        "Warm inviting natural light, cozy welcoming high-end atmosphere, photorealistic, ultra-stable smooth motion, professional real-estate videography look. " +
        "No text, no captions, no watermark, no people, no distortion. Keep it under 110 words.",
      messages: [
        {
          role: "user",
          content:
            `Property name: "${opts.propertyName}". Target duration about ${opts.seconds} seconds. ` +
            (opts.premium ? "Premium, ultra high-end cinematic look. " : "") +
            "Write the video generation prompt.",
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    return text.length > 20 ? text : buildVideoPrompt(opts);
  } catch (e) {
    console.error("Prompt Claude indisponible, repli statique:", e);
    return buildVideoPrompt(opts);
  }
}
