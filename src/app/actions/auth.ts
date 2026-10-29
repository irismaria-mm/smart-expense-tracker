"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { formDataToObject, loginSchema, registerSchema, type FormState } from "@/lib/validation";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS).allowed) {
    return { message: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = registerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await getDb().user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: { create: DEFAULT_CATEGORIES },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: ["An account with this email already exists."] } };
    }
    console.error("Registration failed", error instanceof Error ? error.message : "unknown error");
    return { message: "Could not create your account. Please try again." };
  }

  return signInOrMessage(email, password);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  return signInOrMessage(parsed.data.email, parsed.data.password);
}

async function signInOrMessage(email: string, password: string): Promise<FormState> {
  try {
    // Redirects on success by throwing NEXT_REDIRECT, which must propagate.
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { ok: true };
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "rate_limited") {
      return { message: "Too many login attempts. Please wait 15 minutes and try again." };
    }
    if (error instanceof AuthError) {
      return { message: "Incorrect email or password." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
