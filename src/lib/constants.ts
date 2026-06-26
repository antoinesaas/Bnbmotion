/**
 * Constantes produit BnbMotion — modèle pay-as-you-go (crédits).
 * Génération via kie.ai modèle `kling-3.0/video`.
 *
 * Coût kie.ai réel : 1 000 crédits kie = 4,32 € — marge cible 70% sur pack Essai.
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
  maxRooms: 6,
  minPhotosPerRoom: 2,
  maxPhotosPerRoom: 4,
  minPhotos: 2,
  maxPhotos: 24,  // 6 pièces × 4 photos
  maxSizeMB: 10,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp",
} as const;

/** Durée par défaut (secondes). */
export const FIXED_DURATION = 15;

/** Durées disponibles pour Kling 3.0. */
export type Duration = 5 | 10 | 15;
export const DURATIONS: Duration[] = [5, 10, 15];
export const DURATION_LABELS: Record<Duration, string> = {
  5: "5 secondes",
  10: "10 secondes",
  15: "15 secondes",
};

export type Resolution = "720p" | "1080p" | "4k";
export type KlingMode = "std" | "pro" | "4K";

export const RESOLUTIONS: Resolution[] = ["720p", "1080p", "4k"];

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  "720p": "HD 720p",
  "1080p": "Full HD 1080p",
  "4k": "4K Ultra HD",
};

/** Vidéo de démonstration — servie par Vercel CDN (public/videos/) pour éviter l'egress Supabase. */
export const DEMO_VIDEO_URL = "/videos/demo-villa.mp4";

/**
 * Temps de génération estimé affiché à l'utilisateur. La durée réelle dépend de
 * la charge des serveurs Kling ; mesuré en prod : ~12 min en 1080p, davantage en 4K.
 */
export const GENERATION_ETA_LABEL: Record<Resolution, string> = {
  "720p": "5 à 10 minutes",
  "1080p": "10 à 15 minutes",
  "4k": "20 à 35 minutes",
};

export const KLING_MODE: Record<Resolution, KlingMode> = {
  "720p": "std",
  "1080p": "pro",
  "4k": "4K",
};

/**
 * Coûts en crédits BnbMotion par résolution × durée (marge 70% sur pack Essai).
 * Base : kie.ai 4,32 €/1000 crédits · Essai = 0,005 €/crédit.
 *
 * Crédits kie.ai réels :
 *   720p  : 5s≈110  10s=220  15s=300
 *   1080p : 5s≈150  10s=300  15s=400
 *   4K    : 5s≈335  10s=670  15s=1005
 */
export const CREDIT_COST: Record<Resolution, Record<Duration, number>> = {
  "720p":  { 5: 350,  10: 650,  15: 900 },
  "1080p": { 5: 450,  10: 900,  15: 1200 },
  "4k":    { 5: 1000, 10: 2000, 15: 4000 },
};

export function creditCost(resolution: Resolution, duration: Duration = 15): number {
  return CREDIT_COST[resolution]?.[duration] ?? 1200;
}

/** Coût réel kie.ai en EUR par résolution × durée. */
export const KIE_COST_EUR: Record<Resolution, Record<Duration, number>> = {
  "720p":  { 5: 0.48, 10: 0.95, 15: 1.30 },
  "1080p": { 5: 0.65, 10: 1.30, 15: 1.73 },
  "4k":    { 5: 1.45, 10: 2.89, 15: 4.34 },
};

export const KIE_COST_USD = KIE_COST_EUR;
export function kieCostUsd(resolution: Resolution, duration: Duration = 15): number {
  return KIE_COST_EUR[resolution]?.[duration] ?? 1.73;
}

/** Crédits pour une vidéo 1080p / 15s (référence marketing). */
export const CREDITS_PER_STANDARD_VIDEO = 1200;
export function videosFromCredits(credits: number): number {
  return Math.floor((credits ?? 0) / CREDITS_PER_STANDARD_VIDEO);
}

export const SIGNUP_BONUS_CREDITS = 1000;
export const CREDITS_VALIDITY_DAYS = 90;

export const DEFAULT_RENDER = {
  resolution: "1080p" as Resolution,
  duration: 15 as Duration,
  aspectRatio: "16:9" as const,
};

/** Niveaux d'achat — la 4K est réservée au pack Studio uniquement. */
export type Tier = "free" | "mini" | "decouverte" | "pro" | "studio";
export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  mini: 1,
  decouverte: 2,
  pro: 3,
  studio: 4,
};

/** 4K disponible dès le pack Pro (49,99 €). */
export function canUse4K(tier: string | undefined | null): boolean {
  return (TIER_RANK[(tier as Tier) ?? "free"] ?? 0) >= TIER_RANK.pro;
}

/** Packs de crédits pay-as-you-go. */
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
 * Packs :
 *   Essai       5 €  /  1 000 crédits → ~0 vidéo 1080p/15s (pack découverte)
 *   Découverte 14,99€ /  4 000 crédits → ~3 vidéos 1080p/15s ou ~4 vidéos 1080p/10s
 *   Pro        49,99€ / 15 000 crédits → ~12 vidéos 1080p/15s
 *   Studio     99,99€ / 50 000 crédits → ~41 vidéos 1080p/15s + accès 4K
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
    credits: 50000,
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

/** Types de pièces pour l'upload structuré (picker utilisateur). */
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
  { key: "bureau", label: "Bureau / Dressing", promptLabel: "office or dressing room" },
  { key: "autre", label: "Autre pièce", promptLabel: "additional space" },
] as const;

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
