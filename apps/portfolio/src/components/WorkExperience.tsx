"use client";

import { renderDateRange } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";

export type WorkExperienceItem = {
  key: string;
  role: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  keyPoints: string[];
};

function WorkExperienceEntry({ item }: { item: WorkExperienceItem }) {
  return (
    <article className="relative pl-6 border-l-2 border-primary/20 dark:border-primary/30">
      <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary/60 dark:bg-primary/80 ring-4 ring-white/60 dark:ring-white/[0.06]" />
      <div className="flex flex-col justify-start items-start mb-3">
        <h3 className="text-base font-semibold text-foreground">
          {item.role}
        </h3>
        <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {item.location}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {renderDateRange(item.startDate, item.endDate)}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {item.description}
      </p>
      <ul className="list-disc list-outside ml-5 space-y-1">
        {item.keyPoints.map((desc, index) => (
          <li key={index} className="text-sm text-muted-foreground leading-relaxed">
            {desc}
          </li>
        ))}
      </ul>
    </article>
  );
}

export type WorkExperienceProps = {
  items: WorkExperienceItem[];
};

export function WorkExperience({ items }: WorkExperienceProps) {
  return (
    <Card title="Work Experience">
      {items.map((item) => (
        <WorkExperienceEntry key={item.key} item={item} />
      ))}
    </Card>
  );
}
