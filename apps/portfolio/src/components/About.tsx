"use client";

import React, { ReactNode } from "react";
import { Card } from "@uptonm/ui/components/base/card";
import { copy } from "@/lib/copy";

type AboutProps = {
  children: ReactNode;
};

export function About({ children }: AboutProps) {
  return (
    <Card title={copy.sections.about}>
      <p className="text-base text-muted-foreground leading-relaxed">
        {children}
      </p>
    </Card>
  );
}
