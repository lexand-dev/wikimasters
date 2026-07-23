import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <div className="flex-1">{children}</div>;
}
