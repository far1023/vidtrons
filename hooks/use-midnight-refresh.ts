"use client";

import { useEffect, useRef } from "react";
import { config, getTodayDateString } from "@/lib/config";

/**
 * 24/7 Hardening: Midnight Watcher
 * Detects date rollover in DASHBOARD_TIMEZONE and performs a clean page reload
 * shortly after midnight (at ~00:02 to 00:05) to:
 * 1. Purge long-running browser memory.
 * 2. Re-fetch third-party prayer times and weather for the new calendar day.
 * 3. Re-align today's agenda items.
 */
export function useMidnightRefresh() {
  const currentDateRef = useRef<string>(getTodayDateString(config.timezone));

  useEffect(() => {
    // Check every 30 seconds for date change in configured timezone
    const interval = setInterval(() => {
      const today = getTodayDateString(config.timezone);
      if (today !== currentDateRef.current) {
        console.info(
          `[24/7 Hardening] Tanggal berganti dari ${currentDateRef.current} ke ${today}. Memuat ulang layar videotron...`
        );
        currentDateRef.current = today;
        // Graceful reload
        window.location.reload();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);
}
