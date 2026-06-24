/**
 * Envoi d'e-mails transactionnels via Resend (https://resend.com).
 * Désactivé proprement si `RESEND_API_KEY` n'est pas configurée : la fonction
 * renvoie `false` sans planter, pour ne jamais bloquer une génération.
 *
 * Variables d'environnement :
 *   RESEND_API_KEY  — clé API Resend (obligatoire pour activer l'envoi)
 *   EMAIL_FROM      — expéditeur vérifié, ex. "BnbMotion <noreply@bnbmotion.fr>"
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY absente — e-mail non envoyé.");
    return false;
  }
  const from = process.env.EMAIL_FROM ?? "BnbMotion <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Resend a refusé l'envoi:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Envoi e-mail échoué:", e);
    return false;
  }
}

const SHELL = (inner: string) => `<!doctype html><html lang="fr"><body style="margin:0;background:#faf8f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:20px;font-weight:700;color:#f25c3b;margin-bottom:24px;">BnbMotion</div>
    <div style="background:#fff;border:1px solid #ececec;border-radius:16px;padding:28px;">
      ${inner}
    </div>
    <p style="font-size:12px;color:#9a948c;margin-top:24px;text-align:center;">
      BnbMotion — vidéos immobilières par IA
    </p>
  </div>
</body></html>`;

const BUTTON = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#f25c3b;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px;">${label}</a>`;

export function generationReadyEmail(propertyName: string, dashboardUrl: string) {
  return {
    subject: `🎬 Votre vidéo « ${propertyName} » est prête`,
    html: SHELL(`
      <h1 style="font-size:18px;margin:0 0 12px;">Votre vidéo est prête 🎉</h1>
      <p style="font-size:14px;line-height:1.6;color:#44403c;margin:0 0 20px;">
        La vidéo de <strong>${propertyName}</strong> vient d'être générée. Vous pouvez
        la visionner et la télécharger dès maintenant depuis votre tableau de bord.
      </p>
      ${BUTTON(dashboardUrl, "Voir ma vidéo")}
    `),
  };
}

export function generationFailedEmail(propertyName: string, dashboardUrl: string) {
  return {
    subject: `Votre vidéo « ${propertyName} » n'a pas pu être générée`,
    html: SHELL(`
      <h1 style="font-size:18px;margin:0 0 12px;">La génération a échoué</h1>
      <p style="font-size:14px;line-height:1.6;color:#44403c;margin:0 0 20px;">
        La génération de <strong>${propertyName}</strong> n'a pas abouti et
        <strong>vos crédits ont été intégralement remboursés</strong>. Vous pouvez relancer
        une génération quand vous le souhaitez.
      </p>
      ${BUTTON(dashboardUrl, "Réessayer")}
    `),
  };
}
