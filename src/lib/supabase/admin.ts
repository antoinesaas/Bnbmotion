import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase avec la clé service_role — SERVEUR UNIQUEMENT.
 * Contourne la RLS : à n'utiliser que dans des routes/API serveur de confiance
 * (génération vidéo, webhooks Stripe). Ne jamais l'importer côté client.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Renseignez-la dans .env.local (Supabase > Project Settings > API > service_role).",
    );
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
