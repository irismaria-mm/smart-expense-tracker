"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/form-controls";
import type { FormState } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isRegister ? registerAction : loginAction,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <>
      <h1 className="text-2xl font-semibold">{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isRegister ? "Start tracking your income, expenses and budgets." : "Log in to see your finances."}
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
        <FormMessage message={state.message} ok={state.ok} />
        {isRegister ? (
          <Field id="name" label="Name (optional)" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} />
          </Field>
        ) : null}
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          error={errors.password}
          hint={isRegister ? "At least 8 characters." : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </Field>
        {isRegister ? (
          <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
          </Field>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="mt-2">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isRegister ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </>
  );
}
