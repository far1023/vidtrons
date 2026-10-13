import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SettingForm } from "@/components/forms/setting/setting-form"

export const metadata = {
  title: "Pengaturan Instansi & Layar - Admin Layar Lobby Bappeda",
  description: "Manajemen identitas instansi, slogan, logo, dan akses videotron",
}

export default function PengaturanPage() {
  return (
    <div>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-3" />
          <Separator
            orientation="vertical"
            className="mr-1 h-6 data-vertical:self-auto"
          />
          <h1 className="text-base font-medium">Pengaturan Instansi & Layar</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <SettingForm />
      </div>
    </div>
  )
}
