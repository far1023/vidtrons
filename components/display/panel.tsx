import type { ComponentProps } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Display panel: shadcn Card dengan gaya modern (rounded besar, ring tipis,
 * bayangan lembut berwarna emerald). Tanpa backdrop-blur agar aman dari
 * GPU flicker di layar signage 24/7.
 */
export function Panel({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "min-h-0 min-w-0 gap-0 overflow-hidden rounded-2xl border-0 py-0 text-[length:var(--fs-body)]",
        "bg-white/85 ring-1 ring-black/5 shadow-[0_8px_30px_-12px_rgba(6,78,59,0.28)]",
        className
      )}
      {...props}
    />
  )
}

/** Fixed header of a panel (title only, passive display). */
export function PanelHeader({
  className,
  children,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("shrink-0 p-[var(--pad)]", className)}
      {...props}
    >
      <CardTitle className="text-[length:var(--fs-title)] font-semibold tracking-tight">
        {children}
      </CardTitle>
    </CardHeader>
  )
}

/** Flexible slot below the header; the autoscroll list goes here later. */
export function PanelBody({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn("min-h-0 flex-1 px-[var(--pad)] pb-[var(--pad)]", className)}
      {...props}
    />
  )
}
