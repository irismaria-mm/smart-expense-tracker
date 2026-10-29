import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Returns the signed-in user's id or redirects to login. Use in every page and action. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}
