/**
 * Constantes produit BnbMotion — modèle pay-as-you-go (crédits).
 * Génération via kie.ai modèle `kling-3.0/video` (15s fixe, 3 résolutions).
 */

export const BRAND = {
  name: "BnbMotion",
  domain: "bnbmotion.com",
  tagline: "Transformez vos photos en vidéo professionnelle pour votre logement.",
  subtagline:
    "Un walkthrough cinématographique de votre logement, généré par IA à partir de vos photos.",
} as const;

export const UPLOAD = {
  minPhotos: 2,
  maxPhotos: 7,
  maxSizeMB: 18,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp",
} as const;

/** Durée fixe des vidéos Kling 3.0 (15 secondes). */
export const FIXED_DURATION = 15;

export type Resolution = "720p" | "1080p" | "4k";
export type KlingMode = "std" | "pro" | "4K";

export const RESOLUTIONS: Resolution[] = ["720p", "1080p", "4k"];

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  "720p": "HD 720p",
  "1080p": "Full HD 1080p",
  "4k": "4K Ultra HD",
};

export const KLING_MODE: Record<Resolution, KlingMode> = {
  "720p": "std",
  "1080p": "pro",
  "4k": "4K",
};

/** Coût en crédits BnbMotion par vidéo (15s fixe). */
export const CREDIT_COST: Record<Resolution, number> = {
  "720p": 1000,
  "1080p": 1500,
  "4k": 5000,
};

export function creditCost(resolution: Resolution): number {
  return CREDIT_COST[resolution] ?? 1500;
}

/** Coût réel kie.ai en USD — Kling 3.0 15s, sans audio. */
export const KIE_COST_USD: Record<Resolution, number> = {
  "720p": 1.05,   // 14 credits/s × 15s × $0.005/credit
  "1080p": 1.35,  // 18 credits/s × 15s × $0.005/credit
  "4k": 5.025,    // 67 credits/s × 15s × $0.005/credit
};

export function kieCostUsd(resolution: Resolution): number {
  return KIE_COST_USD[resolution] ?? 1.35;
}

export const CREDITS_PER_STANDARD_VIDEO = 1500;
export function videosFromCredits(credits: number): number {
  return Math.floor((credits ?? 0) / CREDITS_PER_STANDARD_VIDEO);
}

export const SIGNUP_BONUS_CREDITS = 1000;
export const CREDITS_VALIDITY_DAYS = 90;

export const DEFAULT_RENDER = {
  resolution: "1080p" as Resolution,
  duration: FIXED_DURATION,
  aspectRatio: "16:9" as const,
};

/** Niveaux d'achat — la 4K est réservée au pack Pro et au-dessus. */
export type Tier = "free" | "mini" | "decouverte" | "pro" | "studio";
export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  mini: 1,
  decouverte: 2,
  pro: 3,
  studio: 4,
};
export function canUse4K(tier: string | undefined | null): boolean {
  return (TIER_RANK[(tier as Tier) ?? "free"] ?? 0) >= TIER_RANK.pro;
}

/** Packs de crédits (pay-as-you-go, paiement unique Stripe). */
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  tier: Tier;
  popular?: boolean;
  /** % de promo affiché (le prix réel ne change pas). */
  discountPercent?: number;
  stripeEnvKey: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_mini", name: "Essai", credits: 1000, price: 5.0, tier: "mini", stripeEnvKey: "STRIPE_PRICE_PACK_1000" },
  { id: "pack_decouverte", name: "Découverte", credits: 5000, price: 14.99, tier: "decouverte", stripeEnvKey: "STRIPE_PRICE_PACK_5000" },
  { id: "pack_pro", name: "Pro", credits: 20000, price: 49.99, tier: "pro", popular: true, discountPercent: 10, stripeEnvKey: "STRIPE_PRICE_PACK_20000" },
  { id: "pack_studio", name: "Studio", credits: 50000, price: 99.99, tier: "studio", discountPercent: 15, stripeEnvKey: "STRIPE_PRICE_PACK_50000" },
];

export function getPack(id: string | undefined): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Prix d'une vidéo 1080p standard (1500 crédits) pour ce pack. */
export function pricePerStandardVideo(pack: CreditPack): number {
  return (pack.price / pack.credits) * CREDITS_PER_STANDARD_VIDEO;
}

/** Prix "avant promo" barré (le prix réel reste inchangé). */
export function originalPrice(pack: CreditPack): number | null {
  if (!pack.discountPercent) return null;
  return pack.price / (1 - pack.discountPercent / 100);
}

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
