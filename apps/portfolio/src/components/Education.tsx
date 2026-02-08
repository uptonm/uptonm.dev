"use client";

import { renderDateRange } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { GraduationCap } from "lucide-react";

export type EducationItem = {
  key: string;
  school: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
};

function EducationEntry({ item }: { item: EducationItem }) {
  return (
    <div className="flex items-start w-full gap-3">
      <div className="mt-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 p-2 flex-shrink-0">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col items-stretch w-full min-w-0">
        <div className="flex flex-col sm:flex-row lg:flex-col 2xl:flex-row justify-between w-full gap-1">
          <h3 className="text-base font-semibold text-foreground">
            {item.degree}
          </h3>
          <p className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {renderDateRange(item.startDate, item.endDate)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {item.school}
        </p>
      </div>
    </div>
  );
}

export type EducationProps = {
  items: EducationItem[];
};

export function Education({ items }: EducationProps) {
  return (
    <Card title="Education">
      {items.map((item) => (
        <EducationEntry key={item.key} item={item} />
      ))}
    </Card>
  );
}
