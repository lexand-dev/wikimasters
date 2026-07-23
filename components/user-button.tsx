"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import type { Session } from "@/lib/session";

interface UserButtonProps {
  session: Session;
}

export function UserButton({ session }: UserButtonProps) {
  const router = useRouter();

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

  // TODO: add fallback avatar image
  const userImage = session.user?.image ?? undefined;

  return (
    <DropdownMenuGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar size="default">
            <AvatarImage src={userImage} alt={session.user.name} />
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
