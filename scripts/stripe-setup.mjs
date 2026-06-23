/**
 * Crée (idempotent) les produits/prix Stripe pour les packs de crédits BnbMotion.
 * Usage : node scripts/stripe-setup.mjs  (lit STRIPE_SECRET_KEY depuis .env.local)
 */
import Stripe from "stripe";
import { readFileSync } from "node:fs";

const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch {
  /* ignore */
}

const key = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌ STRIPE_SECRET_KEY manquante (.env.local).");
  process.exit(1);
}
const stripe = new Stripe(key);
console.log(`Mode Stripe : ${key.startsWith("sk_live") ? "LIVE" : "TEST"}\n`);

const PACKS = [
  { envKey: "STRIPE_PRICE_PACK_5000", name: "BnbMotion — 5 000 crédits", amount: 1499, meta: { pack_id: "pack_decouverte", credits: "5000" } },
  { envKey: "STRIPE_PRICE_PACK_20000", name: "BnbMotion — 20 000 crédits", amount: 4999, meta: { pack_id: "pack_pro", credits: "20000" } },
  { envKey: "STRIPE_PRICE_PACK_50000", name: "BnbMotion — 50 000 crédits", amount: 9999, meta: { pack_id: "pack_studio", credits: "50000" } },
];

async function ensure(item) {
  let product;
  try {
    const found = await stripe.products.search({ query: `metadata['pack_id']:'${item.meta.pack_id}'` });
    product = found.data[0];
  } catch {
    /* search indispo */
  }
  if (!product) product = await stripe.products.create({ name: item.name, metadata: item.meta });

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
  let price = prices.data[0];
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: item.amount,
      currency: "eur",
      metadata: item.meta,
    });
  }
  return price.id;
}

const out = {};
for (const item of PACKS) {
  out[item.envKey] = await ensure(item);
  console.log(`✅ ${item.envKey} = ${out[item.envKey]}`);
}

console.log("\n----- À coller dans .env.local / Vercel -----");
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
