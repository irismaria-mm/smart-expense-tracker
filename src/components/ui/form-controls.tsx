import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none aria-invalid:border-danger disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-10", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClass, "h-10 pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "min-h-20 py-2", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

/** Label, control and inline error message wired together for accessibility. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error?.length ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error?.length ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger" role="alert">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        ok ? "border-income/30 bg-income/10 text-income" : "border-danger/30 bg-danger/10 text-danger",
      )}
    >
      {message}
    </p>
  );
}
