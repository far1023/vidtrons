"use client"

import { AgendaPanel } from "@/components/display/agenda-panel"
import { BrandingLogos } from "@/components/display/branding-logos"
import { HeaderBar } from "@/components/display/header-bar"
import { LobbyBackground } from "@/components/display/lobby-background"
import { MakroEkonomiPanel } from "@/components/display/makro-ekonomi-panel"
import { PengumumanPanel } from "@/components/display/pengumuman-panel"
import { PromoPanel } from "@/components/display/promo-panel"
import { RunningText } from "@/components/display/running-text"
import { VideoPanel } from "@/components/display/video-panel"
import { WaktuPanel } from "@/components/display/waktu-panel"
import { useDisplayData } from "@/hooks/use-display-data"
import { useMidnightRefresh } from "@/hooks/use-midnight-refresh"

interface DisplayScreenProps {
  pusherKey?: string;
  pusherCluster?: string;
}

/** The only component that knows the grid. Panels fill their cell. */
export function DisplayScreen({ pusherKey, pusherCluster }: DisplayScreenProps = {}) {
  useMidnightRefresh()
  const { data } = useDisplayData({ pusherKey, pusherCluster })

  return (
    <div className="relative isolate grid h-screen w-screen grid-rows-[var(--rows-screen)] overflow-hidden bg-[#fff9f4] text-[var(--c-text)]">
      {/* Background SVG Gradient from bg.html */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        role="img"
        aria-label="Untitled blend"
      >
        <LobbyBackground className="h-full w-full" />
      </div>
      <HeaderBar
        nama={data?.setting.namaInstansi}
        slogan={data?.setting.slogan}
        logoUrl="/images/logos.png"
      />

      <main className="relative isolate z-0 grid min-h-0 grid-cols-[var(--cols-main)] gap-[var(--gap)] px-[var(--pad-x)] py-[var(--gap)]">
        <section className="grid min-h-0 grid-rows-[var(--rows-left)] gap-[var(--gap)]">
          <WaktuPanel />
          <div className="flex min-h-0 flex-col gap-[var(--gap)]">
            <PromoPanel items={data?.promo} />
            <BrandingLogos />
          </div>
        </section>

        <section className="grid min-h-0 grid-rows-[var(--rows-center)] gap-[var(--gap)]">
          <VideoPanel playlist={data?.video} />
          <MakroEkonomiPanel
            items={data?.makroEkonomi}
            qrUrl={data?.setting.makroQrUrl}
            qrLabel={data?.setting.makroQrLabel}
          />
        </section>

        <section className="grid min-h-0 grid-rows-[var(--rows-right)] gap-[var(--gap)]">
          {/* Card parent abu-abu (kolom ala Jira); isi pengumuman = child */}
          <div className="flex min-h-0 flex-col rounded-2xl bg-white/45 p-[var(--pad)] shadow-[0_8px_30px_-12px_rgba(6,78,59,0.25)] ring-1 ring-white/70">
            <PengumumanPanel items={data?.pengumuman} className="flex-1" />
          </div>
          {/* Card parent putih; isi agenda = child */}
          <div className="flex min-h-0 flex-col rounded-2xl bg-white/80 py-[var(--pad)] shadow-[0_8px_30px_-12px_rgba(6,78,59,0.25)] ring-1 ring-black/5">
            <AgendaPanel items={data?.agenda} className="flex-1" />
          </div>
        </section>
      </main>

      <RunningText items={data?.runningText} />
    </div>
  )
}
