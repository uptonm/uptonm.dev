"use client";

import { copy } from "@/lib/copy";
import { StringToHslColor } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { useTheme } from "@uptonm/ui/components/utils/theme-provider";

function SkillPill({ skill }: { skill: string }) {
  const { theme } = useTheme();

  return (
    <li className="inline-block">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/40 dark:bg-white/[0.08] backdrop-blur-sm border border-white/60 dark:border-white/[0.1] px-3.5 py-1.5 transition-colors duration-200 hover:bg-white/60 dark:hover:bg-white/[0.14]">
        <span
          style={{
            backgroundColor: StringToHslColor(
              skill,
              theme === "dark" ? 80 : 65,
              50
            ),
          }}
          className="h-2 w-2 rounded-full flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          {skill}
        </span>
      </span>
    </li>
  );
}

export type SkillsProps = {
  items: string[];
};

export function Skills({ items }: SkillsProps) {
  return (
    <Card title={copy.sections.skills}>
      <ul className="flex flex-wrap gap-2" role="list">
        {items.map((skill) => (
          <SkillPill key={skill} skill={skill} />
        ))}
      </ul>
    </Card>
  );
}
