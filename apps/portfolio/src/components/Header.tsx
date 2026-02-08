"use client";

import { ThemeToggle } from "@uptonm/ui/components/utils/theme-toggle";
import Image, { StaticImageData } from "next/image";
import { ReactNode } from "react";

export type SocialLink = {
  title: string;
  href: string;
  icon: ReactNode;
};

function SocialLinkItem({ link }: { link: SocialLink }) {
  return (
    <a
      title={link.title}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${link.title} profile`}
      className="rounded-full h-11 w-11 flex justify-center items-center bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/15 hover:bg-white/40 dark:hover:bg-white/20 hover:scale-105 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {link.icon}
    </a>
  );
}

type HeaderProps = {
  avatarImage: StaticImageData;
  fullName: string;
  currentRole: string;
  socialLinks: SocialLink[];
};

export function Header({
  avatarImage,
  fullName,
  currentRole,
  socialLinks,
}: HeaderProps) {
  return (
    <header className="relative py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-3xl bg-white/50 dark:bg-white/[0.06] backdrop-blur-xl border border-white/70 dark:border-white/[0.08] shadow-2xl shadow-black/5 dark:shadow-black/30 p-8 sm:p-12 transition-colors duration-300">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-4 ring-violet-500/30 dark:ring-violet-400/20 shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10">
                <Image
                  className="object-cover"
                  alt={`Photo of ${fullName}`}
                  src={avatarImage}
                  width={160}
                  height={160}
                  priority
                />
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold text-foreground tracking-tight">
              {fullName}
            </h1>
            <p className="mt-2 text-lg sm:text-xl text-muted-foreground font-light">
              {currentRole}
            </p>

            <nav aria-label="Social links" className="flex space-x-4 mt-6">
              {socialLinks.map((link) => (
                <SocialLinkItem key={link.title} link={link} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
