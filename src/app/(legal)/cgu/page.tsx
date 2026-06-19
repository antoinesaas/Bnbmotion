import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CGUPage() {
  return (
    <>
      <h1>Conditions Générales d&apos;Utilisation et de Vente</h1>
      <p className="text-muted-foreground">Dernière mise à jour : 19 juin 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l&apos;utilisation du service <strong>BnbMotion</strong>,
        qui permet de générer des vidéos promotionnelles de logements à partir de photos, au moyen
        d&apos;outils d&apos;intelligence artificielle. En créant un compte, vous acceptez ces
        conditions.
      </p>

      <h2>2. Compte utilisateur</h2>
      <p>
        La création d&apos;un compte nécessite une adresse email valide. Vous êtes responsable de la
        confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. Vous
        devez être majeur et disposer des droits sur les photos que vous importez.
      </p>

      <h2>3. Crédits et génération</h2>
      <ul>
        <li>Chaque génération de vidéo consomme 1 crédit.</li>
        <li>1 vidéo est offerte à l&apos;inscription pour tester le service.</li>
        <li>
          Un crédit n&apos;est définitivement débité que si la génération réussit : en cas
          d&apos;échec technique, le crédit est automatiquement recrédité.
        </li>
        <li>
          Les vidéos sont générées par un prestataire tiers ; les résultats sont fournis « en
          l&apos;état », sans garantie de conformité à une attente subjective.
        </li>
      </ul>

      <h2>4. Abonnements, packs et paiement</h2>
      <p>
        Les abonnements (Starter, Pro, Agency) et les packs de crédits sont payables via{" "}
        <strong>Stripe</strong>. Les abonnements sont mensuels, sans engagement, et reconductibles
        tacitement. Vous pouvez les résilier à tout moment depuis votre espace ; la résiliation prend
        effet à la fin de la période en cours. Les crédits mensuels sont rechargés à chaque
        renouvellement.
      </p>

      <h2>5. Téléchargement et essai gratuit</h2>
      <p>
        La vidéo issue de l&apos;essai gratuit est visible en aperçu ; son téléchargement en haute
        définition nécessite un abonnement ou un pack de crédits actif.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Le service fournissant un contenu numérique immédiatement après commande, vous reconnaissez
        renoncer à votre droit de rétractation dès le début de l&apos;exécution (génération), pour
        les crédits consommés.
      </p>

      <h2>7. Propriété intellectuelle des contenus</h2>
      <p>
        Vous conservez la propriété des photos importées et des vidéos générées à partir de
        celles-ci, et garantissez détenir les droits nécessaires. Vous accordez à BnbMotion une
        licence limitée pour traiter ces contenus aux seules fins de fourniture du service.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        BnbMotion s&apos;efforce d&apos;assurer la disponibilité du service mais ne saurait être tenu
        responsable des interruptions, des résultats de génération ou de l&apos;usage que vous faites
        des vidéos. Notre responsabilité est limitée au montant payé sur les 12 derniers mois.
      </p>

      <h2>9. Résiliation</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre un compte en cas
        d&apos;usage frauduleux ou contraire aux présentes.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. À défaut de résolution amiable,
        les tribunaux compétents seront ceux du ressort du siège de l&apos;éditeur.
      </p>

      <p className="mt-8 text-xs text-muted-foreground">
        Modèle fourni à titre indicatif, à adapter à votre situation et à faire valider par un
        professionnel du droit.
      </p>
    </>
  );
}
