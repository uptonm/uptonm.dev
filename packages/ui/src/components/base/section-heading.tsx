import { ReactNode } from "react";
import { cn } from "../../lib/utils";

type SectionHeadingProps = {
  /** Small brand-coloured kicker above the title. */
  eyebrow: ReactNode;
  title: ReactNode;
  /** Extra content rendered after the title (e.g. a blurb). */
  children?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
};

/**
 * The eyebrow + display-serif title pairing used to open each section.
 * Title size/spacing can be tuned per section via `titleClassName`
 * (later utilities win via `tailwind-merge`).
 */
export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
  eyebrowClassName,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.2em] text-brand",
          eyebrowClassName,
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-display text-3xl font-light md:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
