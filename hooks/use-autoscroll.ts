"use client";

import { useEffect, useState, type RefObject } from "react";
import { config } from "@/lib/config";

export interface UseAutoScrollOptions {
  speed?: number; // fraction of container height per second
  pauseSeconds?: number; // pause in seconds at top and bottom
}

export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: UseAutoScrollOptions = {}
) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const speed = options.speed ?? config.scrollKecepatan;
  const pauseMs = (options.pauseSeconds ?? config.scrollJedaDetik) * 1000;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let animId: number | null = null;
    let pos = 0;
    let last: number | null = null;
    let atEnd = false;
    let holdUntil = performance.now() + pauseMs;

    const getMax = () => Math.max(0, el.scrollHeight - el.clientHeight);
    const checkOverflow = () => getMax() > 1;

    function refresh() {
      const overflowing = checkOverflow();
      setIsOverflowing(overflowing);
      el?.setAttribute("data-overflow", String(overflowing));
      if (!overflowing) {
        if (el) el.scrollTop = 0;
        pos = 0;
        atEnd = false;
        holdUntil = performance.now() + pauseMs;
      }
    }

    function frame(t: number) {
      if (last === null) last = t;
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;

      const maxScroll = getMax();
      if (maxScroll > 1 && t >= holdUntil) {
        if (atEnd) {
          pos = 0;
          atEnd = false;
          holdUntil = t + pauseMs;
        } else {
          pos = Math.min(pos + speed * el!.clientHeight * dt, maxScroll);
          if (pos >= maxScroll) {
            atEnd = true;
            holdUntil = t + pauseMs;
          }
        }
        if (el) el.scrollTop = pos;
      }

      animId = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      refresh();
    });

    ro.observe(el);
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }

    refresh();
    animId = requestAnimationFrame(frame);

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      ro.disconnect();
    };
  }, [containerRef, speed, pauseMs]);

  return { isOverflowing };
}
