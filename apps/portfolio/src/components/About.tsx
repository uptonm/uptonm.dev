"use client";

import React, { ReactNode } from "react";
import { Card } from "@uptonm/ui/components/base/card";

type AboutProps = {
  children: ReactNode;
};

export function About({ children }: AboutProps) {
  return (
    <Card title="About Me">
      <p className="text-md text-gray-500 leading-6 dark:text-gray-300">
        {children}
      </p>
    </Card>
  );
}
