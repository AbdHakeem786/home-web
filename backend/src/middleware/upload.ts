import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { AppError } from "../utils/AppError";

const UPLOAD_TYPES = ["avatar", "cnic", "document", "booking", "completion", "chat"] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

// The stored file's extension is derived from this map, never from the client-supplied
// originalname/mimetype - otherwise an attacker can label an HTML/SVG payload as
// (e.g.) "image/png" to pass the filter while keeping a ".html"/".svg" filename, which
// express.static would then serve with an executable Content-Type (stored XSS).
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.params.type as UploadType;
    if (!UPLOAD_TYPES.includes(type)) {
      cb(AppError.badRequest(`Invalid upload type. Allowed: ${UPLOAD_TYPES.join(", ")}`), "");
      return;
    }
    const dir = path.join(UPLOAD_ROOT, type);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] ?? "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in ALLOWED_MIME)) {
      cb(AppError.badRequest("Unsupported file type. Allowed: jpg, png, webp, gif, pdf"));
      return;
    }
    cb(null, true);
  },
});

export { UPLOAD_TYPES };
