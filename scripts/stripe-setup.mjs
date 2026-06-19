/**
 * Crée (idempotent) les produits et prix Stripe pour BnbMotion.
 * Usage : node scripts/stripe-setup.mjs
 * Lit STRIPE_SECRET_KEY depuis .env.local. À relancer si besoin (pas de doublon).
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
  /* pas de .env.local */
}

const key = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌ STRIPE_SECRET_KEY manquante (.env.local).");
  process.exit(1);
}
const stripe = new Stripe(key);
const mode = key.startsWith("sk_live") ? "LIVE" : "TEST";
console.log(`Mode Stripe : ${mode}\n`);

const PLANS = [
  { envKey: "STRIPE_PRICE_STARTER", name: "BnbMotion Starter", amount: 999, recurring: true, meta: { plan_id: "starter" } },
  { envKey: "STRIPE_PRICE_PRO", name: "BnbMotion Pro", amount: 2999, recurring: true, meta: { plan_id: "pro" } },
  { envKey: "STRIPE_PRICE_AGENCY", name: "BnbMotion Agency", amount: 14900, recurring: true, meta: { plan_id: "agency" } },
  { envKey: "STRIPE_PRICE_PACK_5", name: "BnbMotion — Pack 5 vidéos", amount: 1999, recurring: false, meta: { pack_id: "pack_5", credits: "5" } },
  { envKey: "STRIPE_PRICE_PACK_10", name: "BnbMotion — Pack 10 vidéos", amount: 3499, recurring: false, meta: { pack_id: "pack_10", credits: "10" } },
  { envKey: "STRIPE_PRICE_PACK_20", name: "BnbMotion — Pack 20 vidéos", amount: 5999, recurring: false, meta: { pack_id: "pack_20", credits: "20" } },
];

function metaQuery(meta) {
  const k = meta.plan_id ? "plan_id" : "pack_id";
  return `metadata['${k}']:'${meta[k]}'`;
}

async function ensure(item) {
  let product;
  try {
    const found = await stripe.products.search({ query: metaQuery(item.meta) });
    product = found.data[0];
  } catch {
    /* search indispo : on créera */
  }
  if (!product) product = await stripe.products.create({ name: item.name, metadata: item.meta });

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
  let price = prices.data[0];
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: item.amount,
      currency: "eur",
      ...(item.recurring ? { recurring: { interval: "month" } } : {}),
      metadata: item.meta,
    });
  }
  return price.id;
}

const out = {};
for (const item of PLANS) {
  out[item.envKey] = await ensure(item);
  console.log(`✅ ${item.envKey} = ${out[item.envKey]}`);
}

console.log("\n----- À coller dans .env.local / Vercel -----");
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
