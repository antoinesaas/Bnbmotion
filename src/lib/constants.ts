/**
 * Constantes produit BnbMotion — source unique de vérité pour le branding,
 * les limites d'upload, les plans d'abonnement, les packs de crédits et les
 * paramètres de rendu Seedance.
 */

export const BRAND = {
  name: "BnbMotion",
  domain: "bnbmotion.com",
  tagline: "Transformez vos photos en vidéo professionnelle pour votre logement.",
  subtagline:
    "Une vidéo cinématographique qui donne envie de réserver — générée par IA, sans vidéaste.",
} as const;

/** Règles d'upload des photos d'un logement. */
export const UPLOAD = {
  minPhotos: 5,
  maxPhotos: 15,
  maxSizeMB: 10,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp",
} as const;

export type Resolution = "480p" | "720p" | "1080p";

/** Paramètres de rendu effectifs par plan (alignés sur Seedance 1.5 Pro : 4-12 s). */
export interface RenderParams {
  seconds: number;
  resolution: Resolution;
  audio: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
}

export const FREE_TIER: RenderParams = {
  seconds: 6,
  resolution: "480p",
  audio: false,
  aspectRatio: "16:9",
};

export type PlanId = "free" | "starter" | "pro" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  videosPerMonth: number;
  render: RenderParams;
  description: string;
  features: string[];
  highlighted?: boolean;
  stripeEnvKey?: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 9.99,
    videosPerMonth: 4,
    render: { seconds: 8, resolution: "720p", audio: false, aspectRatio: "16:9" },
    description: "Pour le host qui gère un ou deux logements.",
    features: [
      "4 vidéos par mois",
      "Clips de 8 secondes",
      "Qualité HD 720p",
      "Téléchargement MP4 sans filigrane",
      "Historique de vos générations",
    ],
    stripeEnvKey: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    videosPerMonth: 12,
    render: { seconds: 10, resolution: "1080p", audio: false, aspectRatio: "16:9" },
    description: "Le choix des hosts actifs et des conciergeries.",
    features: [
      "12 vidéos par mois",
      "Clips de 10 secondes",
      "Qualité Full HD 1080p",
      "Téléchargement MP4 sans filigrane",
      "Mouvements de caméra premium",
      "Support prioritaire",
    ],
    highlighted: true,
    stripeEnvKey: "STRIPE_PRICE_PRO",
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 149,
    videosPerMonth: 40,
    render: { seconds: 12, resolution: "1080p", audio: true, aspectRatio: "16:9" },
    description: "Pour les agences et gestionnaires multi-logements.",
    features: [
      "40 vidéos par mois",
      "Clips premium de 12 secondes",
      "Full HD 1080p + audio",
      "Téléchargement MP4 sans filigrane",
      "Mouvements de caméra premium",
      "Accès anticipé aux nouveautés",
      "Support dédié",
    ],
    stripeEnvKey: "STRIPE_PRICE_AGENCY",
  },
];

export function getPlan(id: PlanId | string | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Paramètres de rendu selon le plan (free = essai gratuit). */
export function getRenderParams(plan: PlanId | string | undefined): RenderParams {
  return getPlan(plan as PlanId)?.render ?? FREE_TIER;
}

/** Packs de crédits à l'unité (sans abonnement). Prix ajustables. */
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  stripeEnvKey: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_5", name: "Pack 5 vidéos", credits: 5, price: 19.99, stripeEnvKey: "STRIPE_PRICE_PACK_5" },
  { id: "pack_10", name: "Pack 10 vidéos", credits: 10, price: 34.99, stripeEnvKey: "STRIPE_PRICE_PACK_10" },
  { id: "pack_20", name: "Pack 20 vidéos", credits: 20, price: 59.99, stripeEnvKey: "STRIPE_PRICE_PACK_20" },
];

/**
 * Estimation du coût Seedance en USD (suivi de marge).
 * ⚠️ Taux indicatifs — à ajuster selon la facturation réelle kie.ai.
 */
const SEEDANCE_USD_PER_SECOND: Record<Resolution, number> = {
  "480p": 0.012,
  "720p": 0.02,
  "1080p": 0.035,
};
const AUDIO_SURCHARGE_PER_SECOND = 0.01;

export function estimateCostUsd(resolution: Resolution, seconds: number, audio: boolean): number {
  const rate = SEEDANCE_USD_PER_SECOND[resolution] ?? 0.02;
  return Number(((rate + (audio ? AUDIO_SURCHARGE_PER_SECOND : 0)) * seconds).toFixed(4));
}

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
