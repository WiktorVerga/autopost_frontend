import Link from "next/link";
import { LogInIcon } from "lucide-react";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { UserMenuClient } from "./user-menu-client";

/** Reads the session: render it inside <Suspense>. */
export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/login">
              <LogInIcon />
              <span>Sign in</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return <UserMenuClient user={user} />;
}
