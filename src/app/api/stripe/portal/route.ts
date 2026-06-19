import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/** Ouvre le portail de facturation Stripe (gérer / annuler l'abonnement). */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement actif." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/abonnement`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe portal error:", e);
    return NextResponse.json({ error: "Portail indisponible." }, { status: 500 });
  }
}
