import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPack, CREDITS_PER_STANDARD_VIDEO } from "@/lib/constants";

/**
 * Recharge automatique : si activée et que le solde passe sous le coût d'une
 * vidéo standard, débite la carte enregistrée (hors-session) et ajoute les
 * crédits. Best-effort : n'échoue jamais bruyamment (n'interrompt pas la
 * génération). Idempotent via l'ID du PaymentIntent.
 */
export async function maybeAutoRefill(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: p } = await admin
      .from("profiles")
      .select("credits_remaining, auto_refill_enabled, auto_refill_pack, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!p?.auto_refill_enabled || !p.stripe_customer_id) return;
    if (p.credits_remaining >= CREDITS_PER_STANDARD_VIDEO) return;

    const pack = getPack(p.auto_refill_pack ?? "pack_pro");
    if (!pack) return;

    const stripe = getStripe();
    const pms = await stripe.paymentMethods.list({
      customer: p.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    const pm = pms.data[0];
    if (!pm) return;

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(pack.price * 100),
      currency: "eur",
      customer: p.stripe_customer_id,
      payment_method: pm.id,
      off_session: true,
      confirm: true,
      metadata: { user_id: userId, pack_id: pack.id, credits: String(pack.credits), auto_refill: "1" },
    });

    if (pi.status === "succeeded") {
      await admin.rpc("add_credits", {
        p_user_id: userId,
        p_amount: pack.credits,
        p_reason: "auto_refill",
        p_stripe_event_id: pi.id,
      });
    }
  } catch (e) {
    console.error("maybeAutoRefill:", e);
  }
}
