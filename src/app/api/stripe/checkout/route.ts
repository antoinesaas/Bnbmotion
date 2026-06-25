import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getPack } from "@/lib/constants";

export const runtime = "nodejs";

/** Crée une session Stripe Checkout pour l'achat d'un pack de crédits (paiement unique). */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { packId?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const pack = getPack(body.packId ?? body.id);
  if (!pack) return NextResponse.json({ error: "Pack invalide." }, { status: 400 });

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Paiements non configurés." }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerParams: Pick<
    Stripe.Checkout.SessionCreateParams,
    "customer" | "customer_email"
  > = profile?.stripe_customer_id
    ? { customer: profile.stripe_customer_id }
    : { customer_email: user.email ?? undefined };

  const meta = { user_id: user.id, pack_id: pack.id, credits: String(pack.credits) };

  const priceId = getPriceId(pack.stripeEnvKey);
  const keyPrefix = (process.env.STRIPE_SECRET_KEY ?? "").slice(0, 14);
  console.log(`[checkout] key=${keyPrefix}… price=${priceId}`);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...customerParams,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_intent_data: { metadata: meta, setup_future_usage: "off_session" },
      metadata: meta,
      invoice_creation: { enabled: true },
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?credits=success`,
      cancel_url: `${origin}/abonnement?checkout=cancel`,
      locale: "fr",
    });
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const err = e as { type?: string; code?: string; message?: string };
    console.error(`[checkout] stripe error type=${err.type} code=${err.code} msg=${err.message}`);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement. Vérifiez la configuration des prix." },
      { status: 500 },
    );
  }
}
