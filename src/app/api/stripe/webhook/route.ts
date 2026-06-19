import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Webhook Stripe. Recharge les crédits à chaque paiement réussi (idempotent
 * via stripe_event_id), met à jour le plan et les limites du profil.
 *
 * Événements gérés :
 * - checkout.session.completed (mode payment) -> pack de crédits
 * - invoice.paid -> abonnement (souscription + renouvellements mensuels)
 * - customer.subscription.updated/deleted -> statut / annulation
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
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "payment") {
          const userId = s.metadata?.user_id;
          const credits = Number(s.metadata?.credits ?? 0);
          if (userId && credits > 0) {
            await admin.rpc("add_credits", {
              p_user_id: userId,
              p_amount: credits,
              p_reason: "credit_pack",
              p_stripe_event_id: event.id,
            });
          }
        }
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as any;
        const subId: string | undefined =
          typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (!subId) break;

        const sub = (await getStripe().subscriptions.retrieve(subId)) as any;
        const userId: string | undefined = sub.metadata?.user_id;
        const planId: string | undefined = sub.metadata?.plan_id;
        const plan = planId ? getPlan(planId as never) : undefined;
        if (!userId || !plan) break;

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : sub.items?.data?.[0]?.current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
            : null;

        await admin
          .from("profiles")
          .update({
            plan: plan.id,
            max_video_seconds: plan.render.seconds,
            stripe_subscription_id: subId,
            subscription_status: sub.status,
            subscription_current_period_end: periodEnd,
          })
          .eq("id", userId);

        // Recharge les crédits du mois (idempotent par facture via event.id)
        await admin.rpc("add_credits", {
          p_user_id: userId,
          p_amount: plan.videosPerMonth,
          p_reason: "subscription_renewal",
          p_stripe_event_id: event.id,
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const userId: string | undefined = sub.metadata?.user_id;
        if (userId) {
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
          await admin
            .from("profiles")
            .update({ subscription_status: sub.status, subscription_current_period_end: periodEnd })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const userId: string | undefined = sub.metadata?.user_id;
        if (userId) {
          await admin
            .from("profiles")
            .update({ plan: "free", max_video_seconds: 10, subscription_status: "canceled" })
            .eq("id", userId);
        }
        break;
      }
    }
  } catch (e) {
    console.error(`Erreur traitement webhook ${event.type}:`, e);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
