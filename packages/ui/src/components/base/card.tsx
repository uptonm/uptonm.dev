"use client";

import { ReactNode } from "react";

export type CardProps = {
  title: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 pb-0 sm:px-6">
        <h4 className="text-gray-800 font-semibold text-2xl dark:text-white">
          {title}
        </h4>
      </div>
      <div className="px-4 py-5 sm:p-6 space-y-4">{children}</div>
    </div>
  );
}
