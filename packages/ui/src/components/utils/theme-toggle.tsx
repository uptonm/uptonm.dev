"use client";

import { useCallback } from "react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <div
      title={`Turn ${theme === "light" ? "off" : "on"} the lights`}
      className={cn(
        "z-20 rounded-full border-2 h-8 w-8 flex justify-center items-center",
        {
          "bg-gray-800": theme === "light",
          "bg-gray-100": theme === "dark",
        }
      )}
    >
      <i
        onClick={toggleTheme}
        className={cn("fa", {
          "text-white fa-moon fa-md": theme === "light",
          "text-gray-800 fa-sun fa-lg": theme === "dark",
        })}
      />
    </div>
  );
}
