"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { mainNav, settingsNav, type NavItem } from "./nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/**
 * The pathname is runtime data on dynamic routes, so the active state streams
 * in behind Suspense; the fallback renders the same links without a highlight.
 */
function ActiveNavList({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return <NavList items={items} pathname={pathname} />;
}

function Nav({ items }: { items: NavItem[] }) {
  return (
    <Suspense fallback={<NavList items={items} pathname="" />}>
      <ActiveNavList items={items} />
    </Suspense>
  );
}

/** `footer` is a slot so the server-rendered user menu can be passed in. */
export function AppSidebar({ footer }: { footer?: ReactNode }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link href="/" className="flex items-baseline gap-1.5 overflow-hidden">
          <span className="font-serif text-2xl leading-none tracking-tight group-data-[collapsible=icon]:hidden">
            Autopost
          </span>
          <span className="size-2 shrink-0 rounded-full bg-signal" aria-hidden />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.14em]">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Nav items={mainNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.14em]">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Nav items={settingsNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {footer ? <SidebarFooter className="border-t">{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  );
}
