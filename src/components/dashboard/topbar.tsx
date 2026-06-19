"use client";

import { useState } from "react";
import { LogOut, ChevronDown, LayoutDashboard, CreditCard } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { CreditsBadge } from "./credits-badge";

export function DashboardTopbar({
  fullName,
  email,
  credits,
}: {
  fullName: string | null;
  email: string;
  credits: number;
}) {
  const [open, setOpen] = useState(false);
  const initial = (fullName?.trim()?.[0] || email[0] || "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo href="/dashboard" />

        <div className="flex items-center gap-3">
          <CreditsBadge credits={credits} />

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2 transition hover:bg-muted"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-coral-500 text-sm font-semibold text-white">
                {initial}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-soft">
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-medium text-ink">{fullName || "Mon compte"}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                  <nav className="p-1.5 text-sm">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Tableau de bord
                    </Link>
                    <Link
                      href="/abonnement"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-muted"
                    >
                      <CreditCard className="h-4 w-4" /> Abonnement & crédits
                    </Link>
                  </nav>
                  <div className="border-t border-border p-1.5">
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
