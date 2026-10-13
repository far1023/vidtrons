import "server-only";
import { revalidateTag } from "next/cache";
import { DISPLAY_CACHE_TAG } from "@/lib/constants";

/**
 * Revalidates the display feed cache tag.
 * Safely handles environments where the Next.js static generation store is not present (e.g., unit test runners).
 */
export function revalidateDisplayCache(): void {
  try {
    revalidateTag(DISPLAY_CACHE_TAG, "max");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return;
    }
    throw error;
  }
}
