import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BottomNav, MobileHeader, Sidebar } from "@/components/app-nav";
import { getCategories } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const categories = (await getCategories(userId)).map(({ id, name, type }) => ({ id, name, type }));
  const userLabel = session.user?.name || session.user?.email || "Account";

  return (
    <div className="flex min-h-dvh">
      <Sidebar categories={categories} userLabel={userLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav categories={categories} />
    </div>
  );
}
