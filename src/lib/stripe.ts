import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Client Stripe (serveur uniquement). Initialisation paresseuse pour ne pas
 *  planter au build si la clé n'est pas encore configurée. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquante.");
    _stripe = new Stripe(key, {
      appInfo: { name: "BnbMotion" },
      typescript: true,
    });
  }
  return _stripe;
}

/** Récupère un ID de prix Stripe depuis les variables d'environnement. */
export function getPriceId(envKey: string): string {
  const id = process.env[envKey];
  if (!id) throw new Error(`Prix Stripe non configuré : ${envKey}`);
  return id;
}
