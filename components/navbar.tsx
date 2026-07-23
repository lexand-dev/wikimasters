import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { getSession } from "@/lib/session";
import { Button } from "./ui/button";
import { NavigationMenu, NavigationMenuList } from "./ui/navigation-menu";

export const NavBar = async () => {
  const session = await getSession();

  return (
    <nav className="w-full border-b bg-white/80 backdrop supports-backdrop-filter:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="w-full flex items-center justify-between gap-2">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-gray-900"
          >
            Wikimasters
          </Link>
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2">
              {session ? (
                <UserButton session={session} />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button>
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  );
};
