import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border", {
  variants: {
    variant: {
      /** Filled card surface with a border — the default pill. */
      soft: "border-border bg-card",
      /** Transparent, border only. */
      outline: "border-border",
    },
    size: {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1.5 text-xs",
      lg: "px-3.5 py-1.5 text-sm",
    },
  },
  defaultVariants: {
    variant: "soft",
    size: "lg",
  },
});

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
