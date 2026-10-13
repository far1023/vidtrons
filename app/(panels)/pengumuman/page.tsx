import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { PengumumanTable } from "@/components/datatables/pengumuman-table"

export const metadata = {
  title: "Pengumuman - Admin Layar Lobby Bappeda",
  description: "Manajemen informasi dan pengumuman publik pada layar videotron",
}

export default function PengumumanPage() {
  return (
    <div>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-3" />
          <Separator
            orientation="vertical"
            className="mr-1 h-6 data-vertical:self-auto"
          />
          <h1 className="text-base font-medium">Pengumuman</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <PengumumanTable />
      </div>
    </div>
  )
}
