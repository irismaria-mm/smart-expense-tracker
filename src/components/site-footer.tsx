import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border px-4 py-5 text-center text-xs text-muted-foreground", className)}>
      © 2026 Smart Expense Tracker. Built with Claude Code
    </footer>
  );
}
