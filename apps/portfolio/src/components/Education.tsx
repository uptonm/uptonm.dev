"use client";

import { renderDateRange } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";

export type EducationItem = {
  key: string;
  school: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
};

function EducationItem({ item }: { item: EducationItem }) {
  return (
    <div className="flex items-start w-full">
      <i className="fas fa-graduation-cap text-gray-600 mt-1 dark:text-white" />
      <div className="flex flex-col items-stretch ml-2 w-full">
        <div className="flex flex-col sm:flex-row lg:flex-col 2xl:flex-row justify-between w-full">
          <h4 className="text-md font-bold text-gray-500 dark:text-gray-300 whitespace-nowrap">
            {item.degree}
          </h4>
          <p className="text-md font-hairline text-gray-500 dark:text-gray-300">
            {renderDateRange(item.startDate, item.endDate)}
          </p>
        </div>
        <p className="text-md text-gray-500 dark:text-gray-300">
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
        <EducationItem key={item.key} item={item} />
      ))}
    </Card>
  );
}
