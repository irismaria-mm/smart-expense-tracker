import { Wallet } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">Smart Expense Tracker</span>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
