import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Optimistic redirect only; every page, query and action also checks the session.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
