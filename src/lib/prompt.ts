/**
 * Construction du prompt de génération vidéo.
 *
 * Version actuelle : prompt cinématographique statique orienté immobilier.
 * Phase génération : enrichissement par Claude (analyse des photos, type de pièce,
 * style du logement) pour un prompt sur-mesure par bien.
 */

export interface PromptOptions {
  propertyName: string;
  seconds: number;
  premium?: boolean;
}

export function buildVideoPrompt({ propertyName, seconds, premium }: PromptOptions): string {
  return [
    `Cinematic FPV walkthrough of "${propertyName}" at golden hour.`,
    "Calm, slow, deliberate camera motion — never rushed — gliding forward through the home room by room in one seamless continuous take, no cuts.",
    "The camera gently slows to reveal each space, then softly accelerates to the next, with elegant travelling, graceful parallax and depth.",
    "Warm golden sunlight, soft long shadows, cozy welcoming high-end atmosphere, faithful to the room's real furniture, materials and colors.",
    premium
      ? "Ultra high-end cinematic real-estate look with premium color grading."
      : "Professional real-estate videography look.",
    "Photorealistic, crisp detail, ultra-stable smooth gliding motion, no text, no captions, no watermark, no people, no distortion.",
    `Duration about ${seconds} seconds.`,
  ].join(" ");
}
