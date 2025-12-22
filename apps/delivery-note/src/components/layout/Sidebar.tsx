"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, History, Settings, Layers, X, Home, LayoutTemplate, Package, Building2, Store, ChevronsLeft, ChevronsRight, FolderCog, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "업로드", href: "/upload", icon: Upload },
  { name: "템플릿", href: "/templates", icon: LayoutTemplate },
  { name: "처리 이력", href: "/history", icon: History },
  { name: "공급업체별 현황", href: "/stats/suppliers", icon: BarChart3 },
  { name: "품명 매핑", href: "/mappings", icon: Layers },
  { name: "설정", href: "/settings", icon: Settings },
];

const managementItems = [
  { name: "표준품목", href: "/products", icon: Package },
  { name: "공급업체", href: "/suppliers", icon: Building2 },
  { name: "지점", href: "/stores", icon: Store },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();
  const [managementOpen, setManagementOpen] = useState(true);

  const isManagementActive = managementItems.some(item => pathname === item.href);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-background border-r transform transition-all duration-200 ease-in-out flex flex-col",
          // Mobile: full width, slide in/out
          "w-[210px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: icon mode when collapsed
          "md:relative md:translate-x-0",
          sidebarCollapsed ? "md:w-[60px]" : "md:w-[210px]"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="font-bold text-primary">Delivery Note</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-1 overflow-y-auto",
          sidebarCollapsed ? "md:p-2" : "p-4"
        )}>
          {/* 홈, 업로드 */}
          {navigation.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "md:justify-center md:px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(
                  "transition-opacity",
                  sidebarCollapsed && "md:hidden"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* 관리 그룹 */}
          <div className="pt-2">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              title={sidebarCollapsed ? "관리" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full",
                isManagementActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                sidebarCollapsed && "md:justify-center md:px-2"
              )}
            >
              <FolderCog className="h-5 w-5 shrink-0" />
              <span className={cn(
                "flex-1 text-left transition-opacity",
                sidebarCollapsed && "md:hidden"
              )}>
                관리
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                managementOpen && "rotate-180",
                sidebarCollapsed && "md:hidden"
              )} />
            </button>

            {/* 관리 하위 메뉴 */}
            <div className={cn(
              "overflow-hidden transition-all",
              managementOpen ? "max-h-40" : "max-h-0",
              sidebarCollapsed && "md:max-h-40"
            )}>
              {managementItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      sidebarCollapsed ? "md:justify-center md:px-2" : "ml-4"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn(
                      "transition-opacity",
                      sidebarCollapsed && "md:hidden"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 나머지 메뉴 */}
          {navigation.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "md:justify-center md:px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(
                  "transition-opacity",
                  sidebarCollapsed && "md:hidden"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop collapse toggle button */}
        <div className={cn(
          "hidden md:flex border-t",
          sidebarCollapsed ? "p-2 justify-center" : "p-4"
        )}>
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "sm"}
            onClick={toggleSidebarCollapsed}
            className={cn(
              sidebarCollapsed ? "" : "w-full justify-start gap-3"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronsLeft className="h-5 w-5" />
                <span>접기</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
