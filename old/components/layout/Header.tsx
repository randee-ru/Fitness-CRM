"use client";

import { useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Пользователь";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/8 px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/60">{name}</span>
        <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-semibold text-indigo-300">
          {getInitials(name)}
        </div>
      </div>
    </header>
  );
}
