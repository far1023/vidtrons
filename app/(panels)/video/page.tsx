import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { VideoTable } from "@/components/datatables/video-table"

export const metadata = {
  title: "Daftar Video - Admin Layar Lobby Bappeda",
  description: "Manajemen berkas video playlist pada layar videotron",
}

export default function VideoPage() {
  return (
    <div>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-3" />
          <Separator
            orientation="vertical"
            className="mr-1 h-6 data-vertical:self-auto"
          />
          <h1 className="text-base font-medium">Daftar Video</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <VideoTable />
      </div>
    </div>
  )
}
