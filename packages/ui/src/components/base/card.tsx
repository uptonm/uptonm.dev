import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {title ? (
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-medium">{title}</h3>
        </div>
      ) : null}
      <div className="p-6">{children}</div>
    </div>
  );
}
