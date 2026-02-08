"use client";

import { copy } from "@/lib/copy";
import { StringToHslColor } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { useTheme } from "@uptonm/ui/components/utils/theme-provider";

function SkillPill({ skill, index }: { skill: string; index: number }) {
  const { theme } = useTheme();
  const color = StringToHslColor(skill, theme === "dark" ? 80 : 65, 50);

  return (
    <li
      className="inline-block animate-[fade-in-up_0.3s_ease-out_both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span
        className="group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 border bg-white/40 dark:bg-white/[0.06] border-white/60 dark:border-white/[0.08] hover:scale-105 hover:-translate-y-0.5"
        style={{
          boxShadow: `0 0 0 transparent`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 20px ${color}40, 0 0 0 1px ${color}30`;
          e.currentTarget.style.borderColor = `${color}50`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 transparent`;
          e.currentTarget.style.borderColor = "";
        }}
      >
        <span
          style={{ backgroundColor: color }}
          className="h-2 w-2 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
          aria-hidden="true"
        />
        <span className="text-foreground">{skill}</span>
      </span>
    </li>
  );
}

export type SkillsProps = {
  items: {
    category: string;
    items: string[];
  }[];
};

export function Skills({ items }: SkillsProps) {
  let globalIndex = 0;

  return (
    <Card title={copy.sections.skills}>
      <div className="space-y-4">
        {items.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {group.category}
            </h3>
            <ul className="flex flex-wrap gap-2" role="list">
              {group.items.map((skill) => {
                const idx = globalIndex++;
                return <SkillPill key={skill} skill={skill} index={idx} />;
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
