import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Normalise une image du bucket en JPEG standard.
 *
 * Indispensable : les utilisateurs déposent parfois des fichiers AVIF/HEIC/WebP
 * (souvent avec une extension `.png` trompeuse selon le navigateur/téléphone).
 * Le décodeur de Kling 3.0 ne supporte que JPEG/PNG « classiques » et renvoie
 * « Internal Error » sur tout autre encodage. On reconvertit donc systématiquement
 * en JPEG (sharp détecte le format réel d'après les octets, pas l'extension),
 * en corrigeant l'orientation EXIF et en bornant la taille.
 *
 * @returns le chemin du JPEG normalisé dans le bucket, ou `null` en cas d'échec.
 */
export async function normalizeToJpeg(
  admin: SupabaseClient,
  bucket: string,
  path: string,
): Promise<string | null> {
  try {
    const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(path);
    if (dlErr || !blob) {
      console.error(`normalizeToJpeg: téléchargement échoué (${path}):`, dlErr?.message);
      return null;
    }

    const input = Buffer.from(await blob.arrayBuffer());
    const jpeg = await sharp(input)
      .rotate() // applique l'orientation EXIF puis la supprime
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    const outPath = `${path}.norm.jpg`;
    const { error: upErr } = await admin.storage
      .from(bucket)
      .upload(outPath, jpeg, { contentType: "image/jpeg", upsert: true });
    if (upErr) {
      console.error(`normalizeToJpeg: upload échoué (${outPath}):`, upErr.message);
      return null;
    }
    return outPath;
  } catch (e) {
    console.error(`normalizeToJpeg: transcodage échoué (${path}):`, e);
    return null;
  }
}
