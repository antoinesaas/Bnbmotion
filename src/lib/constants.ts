/**
 * Constantes produit BnbMotion — source unique de vérité pour le branding,
 * les limites d'upload, les plans d'abonnement et les packs de crédits.
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
  maxSizeMB: 12,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp",
} as const;

export type PlanId = "free" | "starter" | "pro" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  /** Prix mensuel en euros. */
  priceMonthly: number;
  videosPerMonth: number;
  /** Durée max d'une vidéo générée (secondes). */
  maxSeconds: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  /** ID de prix Stripe (rempli via variable d'environnement en Phase Stripe). */
  stripeEnvKey?: string;
}

/**
 * NOTE durée Pro : le brief indiquait "1( seconde" (coquille).
 * Choix retenu : 15 s (intermédiaire logique entre Starter 10 s et Agency 30 s).
 */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 9.99,
    videosPerMonth: 4,
    maxSeconds: 10,
    description: "Pour le host qui gère un ou deux logements.",
    features: [
      "4 vidéos par mois",
      "Vidéos de 10 secondes",
      "Qualité HD 1080p",
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
    maxSeconds: 15,
    description: "Le choix des hosts actifs et des conciergeries.",
    features: [
      "12 vidéos par mois",
      "Vidéos de 15 secondes",
      "Qualité HD 1080p",
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
    maxSeconds: 30,
    description: "Pour les agences et gestionnaires multi-logements.",
    features: [
      "40 vidéos par mois",
      "Vidéos premium jusqu'à 30 secondes",
      "Qualité HD 1080p",
      "Téléchargement MP4 sans filigrane",
      "Mouvements de caméra premium",
      "Accès anticipé aux nouveautés",
      "Support dédié",
    ],
    stripeEnvKey: "STRIPE_PRICE_AGENCY",
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
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

export const GENERATION_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "muted" },
  processing: { label: "En cours de génération", tone: "info" },
  completed: { label: "Terminée", tone: "success" },
  failed: { label: "Échec", tone: "error" },
};
