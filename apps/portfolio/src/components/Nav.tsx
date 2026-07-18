"use client";

import { copy } from "@/lib/copy";
import { cn } from "@uptonm/ui/lib/utils";
import { ThemeToggle } from "@uptonm/ui/components/utils/theme-toggle";
import { useEffect, useState } from "react";

const links = [
  { href: "#about", label: copy.sections.about },
  { href: "#work", label: copy.sections.workExperience },
  { href: "#skills", label: copy.sections.skills },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors",
        scrolled && "border-b border-border bg-background/80 backdrop-blur",
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
          <a
            href="#contact"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
          >
            Let&apos;s talk
          </a>
        </div>
      </div>
    </header>
  );
}
