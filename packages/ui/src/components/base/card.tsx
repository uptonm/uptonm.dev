"use client";

import { ReactNode } from "react";

export type CardProps = {
  title: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-2xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl border border-white/80 dark:border-white/[0.08] shadow-xl shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
      <div className="px-5 pt-5 pb-0 sm:px-6">
        <h2 className="text-foreground font-semibold text-2xl">{title}</h2>
      </div>
      <div className="px-5 py-5 sm:p-6 space-y-6">{children}</div>
    </section>
  );
}
