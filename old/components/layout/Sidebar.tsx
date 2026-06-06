"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  CreditCard,
  BarChart3,
  PhoneCall,
  Calendar,
  PieChart,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const nav = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/reception", label: "Ресепшен", icon: DoorOpen },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/crm", label: "CRM", icon: BarChart3 },
  { href: "/calls", label: "Звонки", icon: PhoneCall },
  {
    label: "Расписание",
    icon: Calendar,
    children: [
      { href: "/schedule/group", label: "Групповые" },
      { href: "/schedule/personal", label: "Персональные" },
    ],
  },
  {
    label: "Абонементы",
    icon: CreditCard,
    children: [
      { href: "/subscriptions/types", label: "Типы" },
      { href: "/subscriptions/clients", label: "Клиентские" },
    ],
  },
  { href: "/finance", label: "Финансы", icon: PieChart },
  { href: "/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/notifications", label: "PUSH-сообщения", icon: Bell },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(["Абонементы"]);

  function toggleMenu(label: string) {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  return (
    <aside className="flex h-screen w-[250px] flex-col bg-[#1a1f35] border-r border-white/8">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/8">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white text-sm font-bold">
          S
        </div>
        <span className="text-lg font-bold text-white tracking-tight">SportMAX</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {nav.map((item) => {
          if ("children" in item) {
            const isOpen = openMenus.includes(item.label);
            const isActive = item.children!.some((c) => pathname.startsWith(c.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition",
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    size={14}
                    className={cn("transition-transform text-white/30", isOpen && "rotate-90")}
                  />
                </button>

                {isOpen && (
                  <div className="ml-3 mt-0.5 mb-1 border-l border-white/10 pl-4 space-y-0.5">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-2 py-1.5 text-sm rounded-lg transition",
                          pathname === child.href
                            ? "bg-indigo-500/25 text-indigo-300 font-medium"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition",
                isActive
                  ? "bg-indigo-500/25 text-indigo-300"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={17} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Sign out */}
      <div className="p-3 border-t border-white/8">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
