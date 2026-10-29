import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Compared against when the email is unknown so response time does not reveal accounts.
const DUMMY_HASH = "$2b$12$zxda3tp02Z6zHz6YxndoOerpC7OLcRlmrfW8EgGTF.2zWskVuvQqu";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const key = `login:${clientIp(request.headers)}:${email}`;
        if (!rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS).allowed) {
          throw new RateLimitedError();
        }

        const user = await getDb().user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;

        resetRateLimit(key);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
