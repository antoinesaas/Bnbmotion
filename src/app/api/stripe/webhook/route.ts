import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Webhook Stripe (pay-as-you-go). À chaque achat de pack réussi, crédite le
 * compte (idempotent via stripe_event_id) et mémorise le client Stripe pour
 * l'accès aux factures (portail de facturation).
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("Signature webhook invalide:", e);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.user_id;
      const credits = Number(s.metadata?.credits ?? 0);
      const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;

      if (userId && credits > 0) {
        await admin.rpc("add_credits", {
          p_user_id: userId,
          p_amount: credits,
          p_reason: "credit_pack",
          p_stripe_event_id: event.id,
        });
        if (customerId) {
          await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
        }
      }
    }
  } catch (e) {
    console.error(`Erreur traitement webhook ${event.type}:`, e);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
