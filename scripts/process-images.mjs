// Recadre (trim) les images de marque fournies par l'utilisateur.
// node scripts/process-images.mjs
import sharp from "sharp";

const favSrc = "public/ChatGPT Image 19 juin 2026, 16_14_04.png"; // favicon (carré corail)
const logoSrc = "public/ChatGPT Image 19 juin 2026, 16_13_47 (1).png"; // logo horizontal

await sharp(favSrc)
  .trim({ threshold: 15 })
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("src/app/icon.png");

await sharp(logoSrc)
  .trim({ threshold: 15 })
  .png()
  .toFile("public/logo.png");

const meta = await sharp("public/logo.png").metadata();
console.log(`OK -> src/app/icon.png (512x512) + public/logo.png (${meta.width}x${meta.height})`);
