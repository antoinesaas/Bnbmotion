/**
 * Constantes produit BnbMotion — modèle pay-as-you-go (crédits).
 * Génération via kie.ai modèle `kling-3.0/video` (15s fixe, 3 résolutions).
 *
 * Tarification (1 000 crédits kie.ai = 4,32 € de coût, marge cible 70% sur pack Essai) :
 *   720p  : 300 crédits kie = 1,30 € coût → 900 crédits BnbMotion (4,50 € en pack Essai)
 *   1080p : 400 crédits kie = 1,73 € coût → 1 200 crédits BnbMotion (6,00 € en pack Essai)
 *   4K    : 1005 crédits kie = 4,34 € coût → 4 000 crédits BnbMotion (20 € en pack Essai)
 */

export const BRAND = {
  name: "BnbMotion",
  domain: "bnbmotion.com",
  tagline: "Transformez vos photos en vidéo professionnelle pour votre logement.",
  subtagline:
    "Un walkthrough cinématographique de votre logement, généré par IA à partir de vos photos.",
} as const;

export const UPLOAD = {
  minRooms: 1,
  maxRooms: 3,
  minPhotosPerRoom: 2,
  maxPhotosPerRoom: 4,
  minPhotos: 2,   // 1 pièce × 2 photos
  maxPhotos: 12,  // 3 pièces × 4 photos
  maxSizeMB: 10,
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

/** Coût en crédits BnbMotion par vidéo 15s — marge 70% calculée sur le pack Essai. */
export const CREDIT_COST: Record<Resolution, number> = {
  "720p": 900,
  "1080p": 1200,
  "4k": 4000,
};

export function creditCost(resolution: Resolution): number {
  return CREDIT_COST[resolution] ?? 1200;
}

/** Coût réel kie.ai en EUR — Kling 3.0, 15s, sans audio (base 4,32 €/1000 crédits). */
export const KIE_COST_EUR: Record<Resolution, number> = {
  "720p": 1.30,
  "1080p": 1.73,
  "4k": 4.34,
};

/** @deprecated Utiliser KIE_COST_EUR */
export const KIE_COST_USD = KIE_COST_EUR;
export function kieCostUsd(resolution: Resolution): number {
  return KIE_COST_EUR[resolution] ?? 1.73;
}

/** Crédits pour une vidéo 1080p (référence marketing "X vidéos incluses"). */
export const CREDITS_PER_STANDARD_VIDEO = 1200;
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
  discountPercent?: number;
  stripeEnvKey: string;
}

/**
 * Packs mis à jour pour refléter les vrais coûts Kling 3.0.
 * Les quantités de crédits sont ajustées pour maintenir ~le même nombre de vidéos.
 *
 * Référence : 1 video 1080p = 1 200 crédits
 *   Essai       5 €  / 1 000 crédits → ~0  vidéo 1080p (pack d'essai 720p uniquement)
 *   Découverte 14,99€ / 4 000 crédits → ~3 vidéos 1080p ou 1 vidéo 4K
 *   Pro        49,99€ /15 000 crédits → ~12 vidéos 1080p ou 3-4 vidéos 4K
 *   Studio     99,99€ /40 000 crédits → ~33 vidéos 1080p ou 10 vidéos 4K
 */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_mini",
    name: "Essai",
    credits: 1000,
    price: 5.0,
    tier: "mini",
    stripeEnvKey: "STRIPE_PRICE_PACK_1000",
  },
  {
    id: "pack_decouverte",
    name: "Découverte",
    credits: 4000,
    price: 14.99,
    tier: "decouverte",
    stripeEnvKey: "STRIPE_PRICE_PACK_5000",
  },
  {
    id: "pack_pro",
    name: "Pro",
    credits: 15000,
    price: 49.99,
    tier: "pro",
    popular: true,
    discountPercent: 17,
    stripeEnvKey: "STRIPE_PRICE_PACK_20000",
  },
  {
    id: "pack_studio",
    name: "Studio",
    credits: 40000,
    price: 99.99,
    tier: "studio",
    discountPercent: 25,
    stripeEnvKey: "STRIPE_PRICE_PACK_50000",
  },
];

export function getPack(id: string | undefined): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function pricePerStandardVideo(pack: CreditPack): number {
  return (pack.price / pack.credits) * CREDITS_PER_STANDARD_VIDEO;
}

export function originalPrice(pack: CreditPack): number | null {
  if (!pack.discountPercent) return null;
  return pack.price / (1 - pack.discountPercent / 100);
}

/** Types de pièces pour l'upload structuré. */
export interface RoomType {
  key: string;
  label: string;
  promptLabel: string;
}

export const ROOM_TYPES: readonly RoomType[] = [
  { key: "exterieur", label: "Extérieur / Entrée", promptLabel: "exterior and property entrance" },
  { key: "salon", label: "Salon / Séjour", promptLabel: "living and dining room" },
  { key: "cuisine", label: "Cuisine", promptLabel: "kitchen" },
  { key: "chambre", label: "Chambre", promptLabel: "bedroom" },
  { key: "sdb", label: "Salle de bain", promptLabel: "bathroom" },
  { key: "terrasse", label: "Piscine / Terrasse", promptLabel: "pool and terrace" },
  { key: "vue", label: "Vue / Jardin", promptLabel: "garden and outdoor view" },
  { key: "autre", label: "Autre pièce", promptLabel: "additional space" },
] as const;

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
