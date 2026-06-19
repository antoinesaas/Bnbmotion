import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getPlan, CREDIT_PACKS } from "@/lib/constants";

export const runtime = "nodejs";

/** Crée une session Stripe Checkout pour un abonnement ou un pack de crédits. */
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

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email, full_name")
    .eq("id", user.id)
    .single();

  // Récupère ou crée le client Stripe
  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  try {
    if (body.kind === "subscription") {
      const plan = getPlan((body.id ?? "") as never);
      if (!plan || plan.id === "free") {
        return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
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
        customer: customerId,
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
