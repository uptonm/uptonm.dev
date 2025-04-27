"use client";

import { StringToHslColor } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { useTheme } from "@uptonm/ui/components/utils/theme-provider";

function SkillsItem({ skill }: { skill: string }) {
  const { theme } = useTheme();

  return (
    <li key={skill} className="inline">
      <a
        href="#"
        className="relative inline-flex items-center rounded-full border border-gray-300 dark:border-gray-500 px-3 py-0.5 dark:bg-gray-600"
      >
        <div className="absolute flex-shrink-0 flex items-center justify-center">
          <span
            style={{
              backgroundColor: StringToHslColor(
                skill,
                theme === "dark" ? 75 : 60,
                50
              ),
            }}
            className="h-2 w-2 rounded-full"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3.5 text-sm font-medium text-gray-900 dark:text-gray-300">
          {skill}
        </div>
      </a>
      &nbsp;
    </li>
  );
}

export type SkillsProps = {
  items: string[];
};

export function Skills({ items }: SkillsProps) {
  return (
    <Card title="Skills">
      <ul className="leading-8">
        {items.map((skill) => (
          <SkillsItem key={skill} skill={skill} />
        ))}
      </ul>
    </Card>
  );
}
