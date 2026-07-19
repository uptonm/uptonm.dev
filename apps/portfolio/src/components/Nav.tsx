"use client";

import { copy } from "@/lib/copy";
import { cn } from "@uptonm/ui/lib/utils";
import { Button } from "@uptonm/ui/components/base/button";
import { ThemeToggle } from "@uptonm/ui/components/utils/theme-toggle";
import { useEffect, useState } from "react";

const links = [
  { href: "#about", label: copy.sections.about },
  { href: "#projects", label: "Work" },
  { href: "#work", label: copy.sections.workExperience },
  { href: "#skills", label: copy.sections.skills },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Scrolling happens in #scroll-root, not the document — see layout.tsx.
    const root = document.getElementById("scroll-root");
    const target: HTMLElement | Window = root ?? window;
    const onScroll = () =>
      setScrolled((root ? root.scrollTop : window.scrollY) > 12);
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top,0px)] transition-colors",
        // On iOS Safari with the toolbar collapsed, fixed elements pin to the
        // layout viewport, whose top sits below the status-bar/notch strip —
        // the document scrolls up into that strip past the header. The
        // upward ::before paints the strip so content can't appear there.
        scrolled &&
          "border-b border-border bg-background before:absolute before:inset-x-0 before:bottom-full before:h-32 before:bg-background before:content-['']",
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight"
        >
          {copy.brand.name}
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="brand" size="pillSm">
            <a href="#contact">Let&apos;s talk</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
