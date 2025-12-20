"use client";

import Link from "next/link";
import { Menu, UserPlus, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

export function Header() {
  const { toggleSidebar, toggleSidebarCollapsed, sidebarCollapsed } = useUiStore();

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

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={toggleSidebarCollapsed}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
          <span className="sr-only">사이드바 토글</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Delivery Note</span>
        </Link>

        {/* Right side actions */}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hidden sm:flex"
            onClick={() => alert("준비중")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            회원가입
          </Button>
        </div>
      </div>
    </header>
  );
}
