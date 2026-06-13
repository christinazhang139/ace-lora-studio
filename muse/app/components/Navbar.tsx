"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, useApiHealth } from "@ace/ui";

export function Navbar() {
  const pathname = usePathname();
  const { ok } = useApiHealth(8000);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            ACE Muse
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === "/" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700",
              )}
            >
              Continue
            </Link>
            <Link
              href="/history"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === "/history" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700",
              )}
            >
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={cn("w-2 h-2 rounded-full", ok ? "bg-green-500" : "bg-red-400")} />
            <span className="text-gray-400">{ok ? "Connected" : "Offline"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
