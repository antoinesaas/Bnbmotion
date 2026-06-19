import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <>
      <h1>Mentions légales</h1>
      <p className="text-muted-foreground">Dernière mise à jour : 19 juin 2026</p>

      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>BnbMotion</strong> (accessible à l&apos;adresse{" "}
        <a href="https://www.bnbmotion.fr">www.bnbmotion.fr</a>) est édité par :
      </p>
      <ul>
        <li>Raison sociale / nom de l&apos;éditeur : <strong>[À compléter]</strong></li>
        <li>Forme juridique et capital social : [À compléter]</li>
        <li>Siège social : [Adresse à compléter]</li>
        <li>SIRET / RCS : [À compléter]</li>
        <li>Numéro de TVA intracommunautaire : [À compléter]</li>
        <li>Directeur de la publication : [À compléter]</li>
        <li>Contact : <a href="mailto:contact@bnbmotion.fr">contact@bnbmotion.fr</a></li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA
        91789, États-Unis — <a href="https://vercel.com">vercel.com</a>.
      </p>
      <p>
        Les données applicatives (comptes, générations) sont hébergées par <strong>Supabase</strong>{" "}
        (région UE — Irlande). Les paiements sont gérés par <strong>Stripe</strong>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (marque, logo, textes, interface) est protégé par le
        droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite. Les
        vidéos générées appartiennent à l&apos;utilisateur qui en a fourni les photos, dans les
        conditions prévues par les CGU.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question : <a href="mailto:contact@bnbmotion.fr">contact@bnbmotion.fr</a>.
      </p>

      <p className="mt-8 text-xs text-muted-foreground">
        Ce document est un modèle à compléter avec vos informations légales réelles. Il est
        recommandé de le faire relire par un professionnel du droit.
      </p>
    </>
  );
}
