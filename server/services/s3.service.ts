import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_HOST = "kencana.basic.box.cloudeka.id";
const S3_REGION = "kencana";
const S3_BUCKET = "far1023s-bucket-ctkpuc";
const S3_ENDPOINT = `https://${S3_HOST}`;

/** Masa berlaku presigned URL (detik). 7 hari = batas maksimum SigV4. */
const PRESIGN_EXPIRES_IN = 7 * 24 * 60 * 60;

/**
 * Tanda tangan dibuat per jendela waktu ini, bukan per request, sehingga URL
 * video yang sama selalu identik selama satu jendela. Hasilnya cache browser
 * tetap efektif, dan pemutar video tidak mereset playlist tiap data di-refetch.
 * Karena expiry dihitung dari awal jendela, sisa masa berlaku minimal
 * (PRESIGN_EXPIRES_IN - PRESIGN_WINDOW_MS), yaitu 6 hari.
 */
const PRESIGN_WINDOW_MS = 24 * 60 * 60 * 1000;

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;

  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 credentials not configured");
  }

  cachedClient = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    // Path-style (host/bucket/key), sama seperti URL yang dipakai sebelumnya
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    // Cegah SDK versi baru menambah parameter checksum ke URL (sering ditolak
    // provider S3-compatible). Hapus 2 baris ini jika TypeScript mengeluh
    // karena versi @aws-sdk/client-s3 Anda lebih lama.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cachedClient;
}

/**
 * Mengambil key objek dari URL bucket Cloudeka milik kita.
 * Mengembalikan null jika URL bukan milik bucket ini (misalnya video eksternal).
 */
export function extractBucketKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    const prefix = `/${S3_BUCKET}/`;
    if (parsed.host !== S3_HOST || !parsed.pathname.startsWith(prefix)) {
      return null;
    }
    const key = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return key || null;
  } catch {
    return null;
  }
}

/** Presigned GET URL, dihitung lokal (tanpa request jaringan ke S3). */
async function createPresignedGetUrl(key: string): Promise<string> {
  const signingDate = new Date(
    Math.floor(Date.now() / PRESIGN_WINDOW_MS) * PRESIGN_WINDOW_MS
  );

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      // Meminta S3 menyertakan header cache saat browser mengunduh video
      ResponseCacheControl: "public, max-age=86400",
    }),
    { expiresIn: PRESIGN_EXPIRES_IN, signingDate }
  );
}

/**
 * Mengubah URL video menjadi URL yang bisa diputar langsung oleh browser.
 * - URL bucket Cloudeka privat -> presigned URL (byte video tidak lewat Vercel)
 * - URL lain -> dikembalikan apa adanya
 * Jika gagal menandatangani, URL asli dikembalikan agar feed tidak ikut gagal
 * (pemutar akan melewati video yang error).
 */
export async function resolveVideoUrl(url: string): Promise<string> {
  const key = extractBucketKey(url);
  if (!key) return url;

  try {
    return await createPresignedGetUrl(key);
  } catch (error) {
    console.error("Gagal membuat presigned URL video:", key, error);
    return url;
  }
}