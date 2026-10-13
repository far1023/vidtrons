"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({
  items,
}: {
  items: NavMainItem[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  // Automatically expand parent if a sub-item is active
  React.useEffect(() => {
    const newOpenState: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.items?.some((sub) => pathname.startsWith(sub.url))) {
        newOpenState[item.title] = true
      }
    })
    setOpenItems((prev) => ({ ...prev, ...newOpenState }))
  }, [pathname, items])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const renderIcon = (icon: NavMainItem["icon"]) => {
    if (!icon) return null
    if (typeof icon === "function") {
      const IconComponent = icon
      return <IconComponent className="size-4" />
    }
    if (React.isValidElement(icon)) {
      return icon
    }
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isOpen = openItems[item.title] ?? item.isActive ?? false
          const isItemActive = item.url !== "#" && pathname === item.url

          if (hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => toggleItem(item.title)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    {renderIcon(item.icon)}
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight
                    className={`ml-auto size-4 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {isOpen && (
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => {
                      const isSubActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={isSubActive}
                            render={<Link href={subItem.url} />}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={isItemActive}
                tooltip={item.title}
                render={<Link href={item.url} />}
              >
                {renderIcon(item.icon)}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
