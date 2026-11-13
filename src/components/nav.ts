import {
    ActivityIcon,
    AtSignIcon,
    CalendarClockIcon,
    ImagesIcon,
    LayoutGridIcon,
    LightbulbIcon,
    type LucideIcon,
    Settings2Icon,
    LayoutTemplateIcon
} from "lucide-react";

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
};

export const mainNav: NavItem[] = [
    {href: "/dashboard", label: "Overview", icon: LayoutGridIcon},
    {href: "/idea-collections", label: "Idea collections", icon: LightbulbIcon},
    {href: "/programs", label: "Programs", icon: CalendarClockIcon},
    {href: "/contents", label: "Contents", icon: ImagesIcon},
    {href: "/templates", label: "Templates", icon: LayoutTemplateIcon},
    {href: "/logs", label: "Logs", icon: ActivityIcon},
];

export const settingsNav: NavItem[] = [
    {href: "/account", label: "Instagram accounts", icon: AtSignIcon},
    {href: "/settings", label: "Preferences", icon: Settings2Icon},
];
