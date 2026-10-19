import { NextRequest } from "next/server";
import { fetchS3ObjectStream } from "@/server/services/s3.service";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing 'key' query parameter", { status: 400 });
  }

  const range = request.headers.get("range");
  return fetchS3ObjectStream({ key, range });
}
