"use client";

import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserButton() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="size-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const initials = (session.user.name ?? "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenuGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar size="default">
            {session.user.image ? (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name ?? "Account"}
              />
            ) : null}
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-foreground">
                {session.user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DropdownMenuGroup>
  );
}
