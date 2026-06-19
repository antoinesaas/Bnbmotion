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
  const movement = premium
    ? "elegant cinematic drone fly-through with smooth gimbal stabilization, sweeping reveals and graceful parallax"
    : "smooth flowing drone-like camera movement, slow elegant travelling and gentle dolly shots";

  return [
    `Cinematic real estate promotional video of "${propertyName}".`,
    `${movement} gliding through the interior, revealing the living spaces in a natural, continuous motion.`,
    "Warm inviting natural light, cozy and welcoming atmosphere, soft golden-hour ambiance, realistic shadows and reflections.",
    "High-end Airbnb listing aesthetic, photorealistic, crisp 1080p detail, stable smooth motion, no text, no captions, no watermark, no people.",
    `Duration about ${seconds} seconds.`,
  ].join(" ");
}
