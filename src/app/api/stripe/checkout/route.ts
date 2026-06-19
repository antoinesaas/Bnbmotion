import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getPlan, CREDIT_PACKS } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Crée une session Stripe Checkout (abonnement ou pack de crédits).
 * N'a PAS besoin de la clé service_role : la lecture du profil passe par la
 * session utilisateur (RLS), et Stripe crée/réutilise le client. Le
 * stripe_customer_id est enregistré par le webhook après paiement.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { kind?: "subscription" | "pack"; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Paiements non configurés." }, { status: 500 });
  }

  // Réutilise le client Stripe s'il existe déjà, sinon Stripe le crée via l'email.
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

  try {
    if (body.kind === "subscription") {
      const plan = getPlan(body.id);
      if (!plan || plan.id === "free") {
        return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ...customerParams,
        line_items: [{ price: getPriceId(plan.stripeEnvKey!), quantity: 1 }],
        subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/abonnement?checkout=cancel`,
        allow_promotion_codes: true,
        locale: "fr",
      });
      return NextResponse.json({ url: session.url });
    }

    if (body.kind === "pack") {
      const pack = CREDIT_PACKS.find((p) => p.id === body.id);
      if (!pack) return NextResponse.json({ error: "Pack invalide." }, { status: 400 });
      const meta = { user_id: user.id, pack_id: pack.id, credits: String(pack.credits) };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ...customerParams,
        line_items: [{ price: getPriceId(pack.stripeEnvKey), quantity: 1 }],
        payment_intent_data: { metadata: meta },
        metadata: meta,
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/abonnement?checkout=cancel`,
        locale: "fr",
      });
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Type d'achat invalide." }, { status: 400 });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement. Vérifiez la configuration des prix." },
      { status: 500 },
    );
  }
}
