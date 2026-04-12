import multer from "multer";
import path from "path";
import fs from "fs";

const publicRoot = path.join(process.cwd(), "public");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
const allowedMime = ["image/jpeg", "image/png", "image/webp"];

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMime.includes(file.mimetype);
  const extOk = allowedExt.includes(ext);
  if (mimeOk && extOk) {
    return cb(null, true);
  }
  return cb(new Error("Only JPG, PNG, and WebP images up to 2MB are allowed"));
}

function makeStorage(subfolder, prefix) {
  const dest = path.join(publicRoot, "uploads", subfolder);
  return multer.diskStorage({
    destination(_req, _file, cb) {
      ensureDir(dest);
      cb(null, dest);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const safeExt = allowedExt.includes(ext) ? ext : ".jpg";
      const base = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${base}${safeExt}`);
    },
  });
}

/** Product images → /public/uploads/products → URL /uploads/products/… */
export const adminProductUpload = multer({
  storage: makeStorage("products", "product"),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

/** Category images → /public/uploads/categories → URL /uploads/categories/… */
export const adminCategoryUpload = multer({
  storage: makeStorage("categories", "category"),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

/** @deprecated use adminProductUpload / adminCategoryUpload */
export const adminImageUpload = adminProductUpload;
