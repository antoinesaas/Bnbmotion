/**
 * Constantes produit BnbMotion — modèle pay-as-you-go (crédits).
 * Génération via kie.ai modèle `gemini-omni-video` (jusqu'à 7 images, 4K).
 */

export const BRAND = {
  name: "BnbMotion",
  domain: "bnbmotion.com",
  tagline: "Transformez vos photos en vidéo professionnelle pour votre logement.",
  subtagline:
    "Un walkthrough cinématographique de votre logement, généré par IA à partir de vos photos.",
} as const;

/** Upload : le modèle gemini-omni-video accepte jusqu'à 7 images. */
export const UPLOAD = {
  minPhotos: 2,
  maxPhotos: 7,
  maxSizeMB: 18,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp",
} as const;

export type Resolution = "720p" | "1080p" | "4k";
export type Duration = 4 | 6 | 8 | 10;

export const DURATIONS: Duration[] = [4, 6, 8, 10];
export const RESOLUTIONS: Resolution[] = ["720p", "1080p", "4k"];

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  "720p": "HD 720p",
  "1080p": "Full HD 1080p",
  "4k": "4K Ultra HD",
};

/**
 * Coût en crédits BnbMotion par vidéo (4K 10s = 2000, vidéo standard 1080p 10s = 1000).
 * Coût réel kie.ai ≈ 0,85€ pour 1000 crédits → marge saine via les packs.
 */
export const CREDIT_COST: Record<Resolution, Record<Duration, number>> = {
  "720p": { 4: 300, 6: 450, 8: 600, 10: 750 },
  "1080p": { 4: 400, 6: 600, 8: 800, 10: 1000 },
  "4k": { 4: 800, 6: 1200, 8: 1600, 10: 2000 },
};

export function creditCost(resolution: Resolution, duration: Duration): number {
  return CREDIT_COST[resolution]?.[duration] ?? 1000;
}

/** Coût réel kie.ai en USD (suivi de marge réelle par vidéo). */
export const KIE_COST_USD: Record<Resolution, Record<Duration, number>> = {
  "720p": { 4: 0.45, 6: 0.6, 8: 0.75, 10: 0.9 },
  "1080p": { 4: 0.45, 6: 0.6, 8: 0.75, 10: 0.9 },
  "4k": { 4: 1.05, 6: 1.2, 8: 1.35, 10: 1.5 },
};
export function kieCostUsd(resolution: Resolution, duration: Duration): number {
  return KIE_COST_USD[resolution]?.[duration] ?? 0.9;
}

export const CREDITS_PER_STANDARD_VIDEO = 1000;
export function videosFromCredits(credits: number): number {
  return Math.floor((credits ?? 0) / CREDITS_PER_STANDARD_VIDEO);
}

export const SIGNUP_BONUS_CREDITS = 1000;

export const DEFAULT_RENDER = {
  resolution: "1080p" as Resolution,
  duration: 8 as Duration,
  aspectRatio: "16:9" as const,
};

/** Packs de crédits (pay-as-you-go, paiement unique Stripe). */
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  stripeEnvKey: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_decouverte", name: "Découverte", credits: 5000, price: 14.99, stripeEnvKey: "STRIPE_PRICE_PACK_5000" },
  { id: "pack_pro", name: "Pro", credits: 20000, price: 49.99, popular: true, stripeEnvKey: "STRIPE_PRICE_PACK_20000" },
  { id: "pack_studio", name: "Studio", credits: 50000, price: 99.99, stripeEnvKey: "STRIPE_PRICE_PACK_50000" },
];

export function getPack(id: string | undefined): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
