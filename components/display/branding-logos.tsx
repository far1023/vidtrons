import { cn } from "@/lib/utils"

export type BrandingLogosProps = {
  className?: string
}

/**
 * Branding logos section placed below the 4:5 promo card in the left column.
 * Displays "Dumai Berkhidmat" and "#bangga melayani bangsa" official municipal logos.
 */
export function BrandingLogos({ className }: BrandingLogosProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 justify-center px-2 select-none",
        className
      )}
    >
      <div className="flex h-full w-full items-center gap-4">
        {/* Plain <img> per Vercel/branding guidelines */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/berkhidmat colorful.png"
          alt="Dumai Berkhidmat Menuju Kota Idaman"
          className="max-h-[60%] max-w-[45%] object-contain"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bangga.png"
          alt="Bangga Melayani Bangsa"
          className="max-h-[60%] max-w-[45%] object-contain"
        />
      </div>
    </div>
  )
}
