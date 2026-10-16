import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar
        footer={
          // The user menu reads the session, so it streams in behind Suspense
          // while the rest of the shell renders instantly.
          <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
            <UserMenu />
          </Suspense>
        }
      />
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-serif text-lg">Autopost</span>
        </div>
        <div className="hidden px-4 pt-4 md:block">
          <SidebarTrigger className="text-muted-foreground" />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-16 md:px-10 md:pt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
