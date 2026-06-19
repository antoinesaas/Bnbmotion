import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p className="text-muted-foreground">Dernière mise à jour : 19 juin 2026</p>

      <p>
        Cette politique décrit comment <strong>BnbMotion</strong> traite vos données personnelles,
        conformément au Règlement Général sur la Protection des Données (RGPD).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l&apos;éditeur du site (voir{" "}
        <a href="/mentions-legales">Mentions légales</a>). Contact :{" "}
        <a href="mailto:contact@bnbmotion.fr">contact@bnbmotion.fr</a>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Identité et compte : nom, email, société (optionnel).</li>
        <li>Contenus : photos de logements importées et vidéos générées.</li>
        <li>Facturation : gérée par Stripe (nous ne stockons aucune donnée de carte bancaire).</li>
        <li>Données techniques : logs, et statistiques d&apos;audience anonymisées.</li>
      </ul>

      <h2>3. Finalités et base légale</h2>
      <ul>
        <li>Fourniture du service (exécution du contrat).</li>
        <li>Gestion des paiements et abonnements (exécution du contrat / obligation légale).</li>
        <li>Amélioration et sécurité du service (intérêt légitime).</li>
      </ul>

      <h2>4. Sous-traitants et destinataires</h2>
      <p>Vos données peuvent être traitées par nos prestataires techniques :</p>
      <ul>
        <li><strong>Supabase</strong> — authentification, base de données et stockage (UE).</li>
        <li><strong>Vercel</strong> — hébergement de l&apos;application et statistiques d&apos;audience.</li>
        <li><strong>Stripe</strong> — traitement des paiements.</li>
        <li><strong>kie.ai</strong> — génération des vidéos (les photos transmises servent uniquement à produire la vidéo).</li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <p>
        Les données de compte sont conservées tant que le compte est actif, puis supprimées ou
        anonymisées. Les données de facturation sont conservées selon les obligations légales.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
        limitation, d&apos;opposition et de portabilité. Pour les exercer, écrivez à{" "}
        <a href="mailto:contact@bnbmotion.fr">contact@bnbmotion.fr</a>. Vous pouvez introduire une
        réclamation auprès de la CNIL.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Le site utilise des cookies strictement nécessaires (session/authentification) et des mesures
        d&apos;audience anonymisées. Aucun cookie publicitaire n&apos;est utilisé.
      </p>

      <p className="mt-8 text-xs text-muted-foreground">
        Modèle fourni à titre indicatif, à compléter avec vos informations et à faire valider par un
        professionnel.
      </p>
    </>
  );
}
