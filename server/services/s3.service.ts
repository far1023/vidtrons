import "server-only";
import crypto from "crypto";

const S3_HOST = "kencana.basic.box.cloudeka.id";
const S3_REGION = "kencana";
const S3_SERVICE = "s3";
const S3_BUCKET = "far1023s-bucket-ctkpuc";

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  return kSigning;
}

export interface FetchS3StreamOptions {
  key: string;
  range?: string | null;
}

/**
 * Mengambil object dari Cloudeka S3 menggunakan SigV4 authentication.
 * Mengembalikan Response stream yang kompatibel dengan tag <video> browser (mendukung HTTP 206 Partial Content).
 */
export async function fetchS3ObjectStream({
  key,
  range,
}: FetchS3StreamOptions): Promise<Response> {
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return new Response("S3 credentials not configured", { status: 500 });
  }

  // Sanitasi key agar tidak traversal
  const cleanKey = key.replace(/^\/+/, "");
  const canonicalUri = `/${S3_BUCKET}/${cleanKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = crypto.createHash("sha256").update("").digest("hex");

  const headerList: [string, string][] = [
    ["host", S3_HOST],
    ["x-amz-content-sha256", payloadHash],
    ["x-amz-date", amzDate],
  ];

  if (range) {
    headerList.push(["range", range]);
  }

  // Sort header berdasarkan nama
  headerList.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = headerList.map(([k, v]) => `${k}:${v}\n`).join("");
  const signedHeaders = headerList.map(([k]) => k).join(";");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${S3_REGION}/${S3_SERVICE}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = getSignatureKey(secretKey, dateStamp, S3_REGION, S3_SERVICE);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const authHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders: HeadersInit = {
    Host: S3_HOST,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    Authorization: authHeader,
  };

  if (range) {
    requestHeaders.Range = range;
  }

  const s3Url = `https://${S3_HOST}${canonicalUri}`;
  const s3Res = await fetch(s3Url, {
    method: "GET",
    headers: requestHeaders,
  });

  const responseHeaders = new Headers();
  const forwardHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ];

  for (const h of forwardHeaders) {
    const val = s3Res.headers.get(h);
    if (val) responseHeaders.set(h, val);
  }

  responseHeaders.set("Cache-Control", "public, max-age=3600");

  return new Response(s3Res.body, {
    status: s3Res.status,
    statusText: s3Res.statusText,
    headers: responseHeaders,
  });
}
