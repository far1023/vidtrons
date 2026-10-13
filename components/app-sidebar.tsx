"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Film,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Settings,
  TrendingUp,
  User,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AppHeader } from "@/components/app-header"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { getGradientAvatar } from "@/lib/avatar"

const data = {
  navMain: [
    {
      title: "Pengumuman",
      url: "/pengumuman",
      icon: Megaphone,
    },
    {
      title: "Agenda Kegiatan",
      url: "/agenda",
      icon: Calendar,
    },
    {
      title: "Teks Berjalan",
      url: "/running-texts",
      icon: MessageSquareText,
    },
    {
      title: "Promo & Spanduk",
      url: "/promo",
      icon: ImageIcon,
    },
    {
      title: "Daftar Video",
      url: "/video",
      icon: Film,
    },
    {
      title: "Makro Ekonomi",
      url: "/makro-ekonomi",
      icon: TrendingUp,
    },
    {
      title: "Pengaturan",
      url: "/pengaturan",
      icon: Settings,
    },
  ],
}

export function AppSidebar({
  collapsible = "offcanvas",
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Create user object for NavUser component
  const userData = user
    ? {
        name: user.fullname || "Admin",
        email: user.username || "admin@example.com",
        avatar: "/avatars/shadcn.jpg",
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/avatars/shadcn.jpg",
      }
  const pathname = usePathname()

  const storedGradientAvatar = getGradientAvatar()

  return (
    <Sidebar collapsible={collapsible} {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem key="Dashboard">
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
                render={<Link href="/dashboard" />}
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key="Pengguna">
              <SidebarMenuButton
                isActive={pathname === "/pengguna"}
                tooltip="Pengguna"
                render={<Link href="/pengguna" />}
              >
                <User />
                <span>Pengguna</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} gradient={storedGradientAvatar} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
