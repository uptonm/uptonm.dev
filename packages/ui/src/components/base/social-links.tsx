import { cn } from "../../lib/utils";
import { socialIcon } from "../icons";

export type SocialLink = {
  key: string;
  title: string;
  href: string;
};

type SocialLinksProps = {
  links: SocialLink[];
  /** Circle size. `md` = 40px, `lg` = 44px. */
  size?: "md" | "lg";
  className?: string;
  iconClassName?: string;
};

const sizeClasses: Record<NonNullable<SocialLinksProps["size"]>, string> = {
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

/**
 * A row of circular social icon links. Renders a fragment so it can drop into
 * an existing flex container, or be wrapped in one for standalone use.
 */
export function SocialLinks({
  links,
  size = "md",
  className,
  iconClassName = "h-5 w-5",
}: SocialLinksProps) {
  return (
    <>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.title}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand hover:text-brand",
            sizeClasses[size],
            className,
          )}
        >
          {socialIcon(link.key, iconClassName)}
        </a>
      ))}
    </>
  );
}
