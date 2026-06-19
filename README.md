# BnbMotion

Générez une vidéo promotionnelle cinématographique de votre logement (Airbnb, location courte durée) à partir de vos photos, par IA. **Pour les hosts qui n'ont pas le temps.**

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (palette « chaleureux corail »)
- **Supabase** — Auth + Postgres + Storage (RLS)
- **Stripe** — abonnements & packs de crédits *(à venir)*
- **Seedance 1.5** — génération vidéo, orchestrée avec Claude *(à venir)*

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseignez les valeurs
npm run dev
```

## Variables d'environnement

Voir `.env.example`. Les clés requises :

| Variable | Usage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publishable (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role — **serveur uniquement** (crédits, génération, webhooks) |
| `SEEDANCE_API_KEY` | API de génération vidéo |
| `ANTHROPIC_API_KEY` | Orchestration des prompts (Claude) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Paiements |

> ⚠️ Ne jamais committer `.env.local`. Tous les `.env*` sont ignorés par git sauf `.env.example`.

## Architecture

```
src/
  app/
    (auth)/            # login, signup (Server Actions)
    auth/              # callback confirmation email, signout
    dashboard/         # espace host : upload + historique (protégé)
    abonnement/        # tarifs / gestion abonnement
    api/generate/      # création de génération (réserve 1 crédit)
    page.tsx           # landing publique
  components/          # ui, dashboard, marketing
  lib/
    supabase/          # clients browser / server / admin + middleware
    constants.ts       # plans, packs, limites d'upload
    prompt.ts          # construction du prompt vidéo
```

## Modèle de crédits

- 1 crédit = 1 vidéo. **1 vidéo offerte** à l'inscription (trigger Postgres).
- Le crédit est **réservé** au lancement et **remboursé automatiquement** si la génération échoue → un crédit n'est consommé que si la vidéo réussit.
- `credits_remaining` est modifiable **uniquement** côté serveur (fonctions `SECURITY DEFINER`, accessibles au seul `service_role`).
- Chaque génération stocke `cost_usd_estimate` pour suivre la marge réelle.

## Sécurité

- RLS activée sur toutes les tables ; chaque utilisateur n'accède qu'à ses données.
- Photos et vidéos stockées dans des buckets privés, cloisonnés par utilisateur.
- Téléchargement de la vidéo finale conditionné à un abonnement actif (paywall essai gratuit).
