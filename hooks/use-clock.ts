"use client";

import { useEffect, useState } from "react";
import { config, getSecondsSinceMidnight } from "@/lib/config";

export interface ClockState {
  day: string;
  date: string;
  time: string;
  secondsNow: number;
}

export function useClock(timezone: string = config.timezone): ClockState {
  const [state, setState] = useState<ClockState>(() => {
    const now = new Date();
    return {
      day: new Intl.DateTimeFormat("id-ID", {
        timeZone: timezone,
        weekday: "long",
      }).format(now),
      date: new Intl.DateTimeFormat("id-ID", {
        timeZone: timezone,
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
      time: new Intl.DateTimeFormat("id-ID", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(now),
      secondsNow: getSecondsSinceMidnight(now, timezone),
    };
  });

  useEffect(() => {
    function tick() {
      const now = new Date();
      setState({
        day: new Intl.DateTimeFormat("id-ID", {
          timeZone: timezone,
          weekday: "long",
        }).format(now),
        date: new Intl.DateTimeFormat("id-ID", {
          timeZone: timezone,
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now),
        time: new Intl.DateTimeFormat("id-ID", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(now),
        secondsNow: getSecondsSinceMidnight(now, timezone),
      });
    }

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  return state;
}
