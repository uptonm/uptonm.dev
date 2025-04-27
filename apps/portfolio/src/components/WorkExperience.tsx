"use client";

import { renderDateRange } from "@/lib/utils";
import { Card } from "@uptonm/ui/components/base/card";
import { v4 } from "uuid";

export type WorkExperienceItem = {
  key: string;
  role: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  keyPoints: string[];
};

function WorkExperienceItem({ item }: { item: WorkExperienceItem }) {
  return (
    <div key={item.key}>
      <div className="flex flex-col justify-start items-start mb-4">
        <h4 className="text-md font-bold text-gray-500 mr-2 sm:whitespace-nowrap dark:text-gray-300">
          {item.role}
        </h4>
        <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center">
          <span className="text-md font-hairline text-gray-500 dark:text-gray-300">
            {item.location}
          </span>
          <span className="text-md font-hairline text-gray-500 dark:text-gray-300">
            {renderDateRange(item.startDate, item.endDate)}
          </span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-200 mb-2">
        {item.description}
      </p>
      <ul className="list-disc list-outside ml-8">
        {item.keyPoints.map((desc) => (
          <li key={v4()} className="text-gray-500 leading-6 dark:text-gray-300">
            {desc}
          </li>
        ))}
      </ul>
    </div>
  );
}

export type WorkExperienceProps = {
  items: WorkExperienceItem[];
};

export function WorkExperience({ items }: WorkExperienceProps) {
  return (
    <Card title="Work Experience">
      {items.map((item) => (
        <WorkExperienceItem key={item.key} item={item} />
      ))}
    </Card>
  );
}
