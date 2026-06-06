import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Providers from "@/components/layout/Providers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Providers>
      <div className="grid grid-cols-[250px_1fr] h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
