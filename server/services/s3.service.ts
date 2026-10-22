import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_HOST = "kencana.basic.box.cloudeka.id";
const S3_REGION = "kencana";
const S3_BUCKET = "far1023s-bucket-ctkpuc";
const S3_ENDPOINT = `https://${S3_HOST}`;

/** Presigned URL lifetime (seconds). 7 days = SigV4 maximum. */
const PRESIGN_EXPIRES_IN = 7 * 24 * 60 * 60;

/**
 * Signatures are created per time window rather than per request, so the URL
 * of a given video stays identical within one window. The browser cache
 * remains effective and the video player does not reset its playlist on refetch.
 * Since expiry is counted from the window start, the minimum remaining lifetime is
 * (PRESIGN_EXPIRES_IN - PRESIGN_WINDOW_MS), i.e. 6 days.
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
    // Path-style (host/bucket/key), same as the URLs used previously
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    // Prevent newer SDK versions from adding checksum params to the URL (often rejected by
    // S3-compatible providers). Remove these 2 lines if TypeScript complains
    // because your @aws-sdk/client-s3 version is older.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cachedClient;
}

/**
 * Extracts the object key from a URL of our Cloudeka bucket.
 * Returns null if the URL does not belong to this bucket (e.g. external video).
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

/** Presigned GET URL, computed locally (no network request to S3). */
async function createPresignedGetUrl(key: string): Promise<string> {
  const signingDate = new Date(
    Math.floor(Date.now() / PRESIGN_WINDOW_MS) * PRESIGN_WINDOW_MS
  );

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      // Ask S3 to include cache headers when the browser downloads the video
      ResponseCacheControl: "public, max-age=86400",
    }),
    { expiresIn: PRESIGN_EXPIRES_IN, signingDate }
  );
}

/**
 * Converts a video URL into one the browser can play directly.
 * - Private Cloudeka bucket URL -> presigned URL (video bytes bypass Vercel)
 * - Any other URL -> returned as is
 * If signing fails, the original URL is returned so the feed does not fail
 * (the player will skip the broken video).
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