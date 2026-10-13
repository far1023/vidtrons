"use client";

import * as React from "react";
import { useAutoScroll, type UseAutoScrollOptions } from "@/hooks/use-autoscroll";
import { cn } from "@/lib/utils";

export interface AutoscrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  speed?: number;
  pauseSeconds?: number;
}

export function Autoscroll({
  children,
  className,
  speed,
  pauseSeconds,
  ...props
}: AutoscrollProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { isOverflowing } = useAutoScroll(containerRef, {
    speed,
    pauseSeconds,
  });

  return (
    <div
      ref={containerRef}
      data-autoscroll
      data-overflow={String(isOverflowing)}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto overscroll-contain select-none",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "data-[overflow=true]:[mask-image:var(--fade-mask)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
