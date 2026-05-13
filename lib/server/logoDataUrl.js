import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Reads `public/logo.png` if present. Used by app/icon, apple-icon, opengraph-image.
 * @returns {Promise<string|null>} data URL or null
 */
export async function getLogoDataUrl() {
  try {
    const buf = await readFile(join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}
