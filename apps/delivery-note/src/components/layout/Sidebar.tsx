"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, History, Settings, Layers, X, Home, LayoutTemplate, Package, Building2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "업로드", href: "/upload", icon: Upload },
  { name: "표준품목 관리", href: "/products", icon: Package },
  { name: "공급업체 관리", href: "/suppliers", icon: Building2 },
  { name: "지점 관리", href: "/stores", icon: Store },
  { name: "템플릿", href: "/templates", icon: LayoutTemplate },
  { name: "처리 이력", href: "/history", icon: History },
  { name: "품명 매핑", href: "/mappings", icon: Layers },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUiStore();

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
          "fixed inset-y-0 left-0 z-50 w-[210px] bg-background border-r transform transition-all duration-200 ease-in-out",
          // Mobile: slide in/out
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: collapse/expand
          "md:relative md:translate-x-0",
          sidebarCollapsed && "md:w-0 md:border-r-0 md:overflow-hidden"
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
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
