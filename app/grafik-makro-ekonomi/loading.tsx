import { LobbyBackground } from "@/components/display/lobby-background"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#fff9f4] text-[var(--c-text)]">
      {/* Background SVG Gradient dari halaman lobby */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        role="img"
        aria-label="Lobby background"
      >
        <LobbyBackground className="h-full w-full" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-2 h-10 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-52 w-full sm:h-56" />
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </main>
  )
}
