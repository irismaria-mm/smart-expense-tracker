"use client";

import { LayoutDashboard, LogOut, PiggyBank, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { AddTransactionButton, type CategoryChoice } from "@/components/transaction-form";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
];

export function Sidebar({ categories, userLabel }: { categories: CategoryChoice[]; userLabel: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
          <Wallet className="size-5" aria-hidden="true" />
        </span>
        <span className="font-semibold">Smart Expense</span>
      </Link>
      <AddTransactionButton categories={categories} className="mb-6 w-full" />
      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <p className="truncate px-3 text-sm text-muted-foreground" title={userLabel}>
          {userLabel}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <Wallet className="size-4" aria-hidden="true" />
        </span>
        <span className="font-semibold">Smart Expense</span>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </form>
    </header>
  );
}

export function BottomNav({ categories }: { categories: CategoryChoice[] }) {
  const pathname = usePathname();
  const [first, ...rest] = NAV_ITEMS;
  const item = ({ href, label, icon: Icon }: (typeof NAV_ITEMS)[number]) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        {label}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {item(first)}
      <div className="flex flex-1 justify-center">
        <AddTransactionButton categories={categories} compact className="size-12 rounded-full shadow-md" />
      </div>
      {rest.map(item)}
    </nav>
  );
}
