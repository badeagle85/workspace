"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Upload, History, Settings, Layers, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

const navigation = [
  { name: "업로드", href: "/upload", icon: Upload },
  { name: "템플릿", href: "/templates", icon: LayoutTemplate },
  { name: "처리 이력", href: "/history", icon: History },
  { name: "품명 매핑", href: "/mappings", icon: Layers },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Delivery Note</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Link href="/upload">
            <Button size="sm" className="hidden sm:flex">
              <Upload className="h-4 w-4 mr-2" />
              새 업로드
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
