"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/shared/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar"

interface LayoutWrapperProps {
  children: React.ReactNode
  title?: string
  isAdmin?: boolean
}

export function LayoutWrapper({ children, title, isAdmin = false }: LayoutWrapperProps) {
  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title && (
            <h1 className="text-xl font-semibold">{title}</h1>
          )}
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
