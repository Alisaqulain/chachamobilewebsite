/**
 * Online placeholder images (Unsplash) matched to spare-part categories and product names.
 * URLs are from the same set already allowed in next.config — avoids broken remote images.
 */

function unsplash(id, w = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;
}

/** Curated Unsplash assets (mobile / parts context). */
const ASSET = {
  smartphone: unsplash("photo-1592899677859-90f0c5d7c0c8"),
  iphone: unsplash("photo-1511707171634-5f897ff02aa9"),
  battery: unsplash("photo-1601784555128-393f09b9b0a5"),
  charging: unsplash("photo-1583394837333-0879db6f85fa"),
  phonesStack: unsplash("photo-1610945265064-0e34e5519bbf"),
  handsPhones: unsplash("photo-1556656793-08538906a9fa"),
  cameraBump: unsplash("photo-1609091839311-5367944d3491"),
};

/**
 * Pools per part type — different compositions so similar parts still look distinct on cards.
 */
export const PART_IMAGE_POOLS = {
  display: [ASSET.smartphone, ASSET.iphone, ASSET.handsPhones, ASSET.phonesStack, ASSET.cameraBump],
  battery: [ASSET.battery, ASSET.charging, ASSET.iphone, ASSET.phonesStack],
  charging: [ASSET.charging, ASSET.iphone, ASSET.smartphone, ASSET.handsPhones, ASSET.phonesStack],
  camera: [ASSET.cameraBump, ASSET.iphone, ASSET.smartphone, ASSET.handsPhones, ASSET.phonesStack],
  speaker: [ASSET.handsPhones, ASSET.phonesStack, ASSET.smartphone, ASSET.iphone],
  body: [ASSET.phonesStack, ASSET.iphone, ASSET.smartphone, ASSET.cameraBump, ASSET.handsPhones],
};

export const CATEGORY_SLUG_CARD_IMAGE = {
  display: PART_IMAGE_POOLS.display[0],
  battery: PART_IMAGE_POOLS.battery[0],
  "charging-jack": PART_IMAGE_POOLS.charging[0],
  "folder-body": PART_IMAGE_POOLS.body[0],
  speaker: PART_IMAGE_POOLS.speaker[0],
  camera: PART_IMAGE_POOLS.camera[0],
};

function hashMod(str, m) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return m ? h % m : 0;
}

function categoryKeyFromApiLabel(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("display") || s.includes("touch")) return "display";
  if (s.includes("battery")) return "battery";
  if (s.includes("charg") || s.includes("jack")) return "charging";
  if (s.includes("camera")) return "camera";
  if (s.includes("speaker")) return "speaker";
  if (s.includes("body") || s.includes("folder")) return "body";
  return "display";
}

function inferKeyFromText(text) {
  const s = String(text || "").toLowerCase();
  if (
    /\bamoled\b|\blcd\b|\boled\b|\bdigitizer\b|\btouch\b|\bscreen\b|\bdisplay\b/i.test(s) &&
    !/\bback\s*glass\b|\brear\s*glass\b/i.test(s)
  ) {
    return "display";
  }
  if (/\bback\s*glass\b|\bglass\s*panel\b|\bchassis\b|\bmid[- ]?frame\b|\bframe\b|\bfolder\b|\bbody\b/i.test(s))
    return "body";
  if (/\bcamera\b|\blens\b|\bmodule\b|\btrue\s*depth\b|\bultrawide\b/i.test(s)) return "camera";
  if (/\bbattery\b|\bli[- ]?ion\b|\bmah\b/i.test(s)) return "battery";
  if (/\bspeaker\b|\bearpiece\b|\bbuzzer\b/i.test(s)) return "speaker";
  if (
    /\bcharge\b|\bcharging\b|\busb\b|\bport\b|\bflex\b|\bjack\b|\bboard\b|\bpcb\b|\bconnector\b|\bdock\b/i.test(s)
  ) {
    return "charging";
  }
  return null;
}

export function partImageKeyForProduct(product) {
  const name = product?.name || "";
  const model = product?.model || "";
  const catStr =
    typeof product?.category === "string"
      ? product.category
      : product?.category?.name || product?.categoryId?.name || "";
  const fromName = inferKeyFromText(`${name} ${model}`);
  if (fromName) return fromName;
  return categoryKeyFromApiLabel(catStr);
}

export function pickFromPool(key, seed) {
  const pool = PART_IMAGE_POOLS[key] || PART_IMAGE_POOLS.display;
  const idx = hashMod(seed, pool.length);
  return pool[idx];
}

function isUsableImageUrl(s) {
  const t = String(s || "").trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (t.startsWith("/")) return true;
  return false;
}

export function resolveProductCardImage(product) {
  const raw = product?.images?.find((x) => isUsableImageUrl(x));
  if (raw) return String(raw).trim();
  const key = partImageKeyForProduct(product);
  return pickFromPool(key, product?._id || product?.name || "x");
}

export function productPlaceholderImages(product) {
  const saved = (product?.images || []).filter((x) => isUsableImageUrl(x)).map((x) => String(x).trim());
  if (saved.length) return saved;
  const key = partImageKeyForProduct(product);
  const pool = PART_IMAGE_POOLS[key] || PART_IMAGE_POOLS.display;
  const seed = product?._id || product?.name || "p";
  const i = hashMod(seed, pool.length);
  const a = pool[i];
  const b = pool[(i + 1) % pool.length];
  return a === b ? [a] : [a, b];
}

export function categoryHeroImage(slug) {
  return CATEGORY_SLUG_CARD_IMAGE[slug] || PART_IMAGE_POOLS.display[0];
}
