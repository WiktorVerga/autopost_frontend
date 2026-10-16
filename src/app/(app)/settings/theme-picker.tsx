"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const subscribe = () => () => {};

/** The stored theme is only known in the browser, so nothing is selected until hydration. */
function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Tabs value={mounted ? theme : ""} onValueChange={setTheme}>
      <TabsList aria-label="Theme">
        <TabsTrigger value="light">
          <SunIcon />
          Light
        </TabsTrigger>
        <TabsTrigger value="dark">
          <MoonIcon />
          Dark
        </TabsTrigger>
        <TabsTrigger value="system">
          <MonitorIcon />
          System
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
