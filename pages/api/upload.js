import { adminProductUpload, adminCategoryUpload } from "@/lib/multerUpload";
import { verifyAdminToken } from "@/lib/jwt";
import multer from "multer";

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        reject(result);
        return;
      }
      resolve(result);
    });
  });
}

const productUpload = adminProductUpload.fields([
  { name: "images", maxCount: 10 },
  { name: "file", maxCount: 1 },
]);

const categoryUpload = adminCategoryUpload.fields([{ name: "file", maxCount: 1 }]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies?.admin_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await verifyAdminToken(token);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const kind = String(req.query?.kind || "product").toLowerCase();
  const upload = kind === "category" ? categoryUpload : productUpload;

  try {
    await runMiddleware(req, res, upload);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Each file must be 2MB or smaller" });
      }
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err?.message || "Upload failed" });
  }

  const buckets = req.files || {};
  const fromImages = buckets.images || [];
  const fromFile = buckets.file || [];
  const files = [...fromImages, ...fromFile];

  if (!files.length) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const sub = kind === "category" ? "categories" : "products";
  const urls = files.map((f) => `/uploads/${sub}/${f.filename}`);
  return res.status(200).json({ urls, url: urls[0] });
}
