import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { StoredFile } from '../models/types';

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const LOCAL_DIR = path.resolve(process.cwd(), 'uploads');

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
}

/**
 * Upload a buffer to Cloudinary if configured, otherwise persist to local disk.
 * Returns a StoredFile descriptor stored on the relevant document.
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; filename: string; mimeType?: string }
): Promise<StoredFile> {
  const { folder, filename, mimeType } = options;

  if (env.cloudinary.enabled) {
    const result = await new Promise<{ secure_url: string; public_id: string; bytes: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `rentalflow/${folder}`, resource_type: 'auto' },
          (error, res) => {
            if (error || !res) return reject(error);
            resolve(res as never);
          }
        );
        stream.end(buffer);
      }
    );
    return {
      url: result.secure_url,
      publicId: result.public_id,
      filename,
      mimeType,
      size: result.bytes,
      uploadedAt: new Date(),
    };
  }

  // Local fallback
  ensureLocalDir();
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '_');
  const dir = path.join(LOCAL_DIR, safeFolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${filename}`;
  const fullPath = path.join(dir, unique);
  fs.writeFileSync(fullPath, buffer);
  return {
    url: `/uploads/${safeFolder}/${unique}`,
    filename,
    mimeType,
    size: buffer.length,
    uploadedAt: new Date(),
  };
}

/**
 * Best-effort fetch of an image into a Buffer for embedding in PDFs.
 * Supports remote http(s) URLs and locally-stored /uploads paths. Returns null
 * on any failure so callers can simply skip the image.
 */
export async function fetchImageBuffer(url?: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    if (url.startsWith('/uploads/')) {
      const local = path.join(process.cwd(), url.replace(/^\//, ''));
      return fs.existsSync(local) ? fs.readFileSync(local) : null;
    }
    if (/^https?:\/\//.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (err) {
    console.warn('[storage] Failed to fetch image buffer:', err);
  }
  return null;
}

export async function deleteFile(file: StoredFile): Promise<void> {
  try {
    if (env.cloudinary.enabled && file.publicId) {
      await cloudinary.uploader.destroy(file.publicId, { resource_type: 'image' });
      return;
    }
    if (file.url.startsWith('/uploads/')) {
      const local = path.join(process.cwd(), file.url.replace(/^\//, ''));
      if (fs.existsSync(local)) fs.unlinkSync(local);
    }
  } catch (err) {
    console.warn('[storage] Failed to delete file:', err);
  }
}

export { LOCAL_DIR };
