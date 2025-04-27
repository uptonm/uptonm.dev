"use client";

import { useTheme } from "@uptonm/ui/components/utils/theme-provider";
import { ThemeToggle } from "@uptonm/ui/components/utils/theme-toggle";
import Image, { StaticImageData } from "next/image";
import { ReactNode, useCallback } from "react";

export type SocialLink = {
  title: string;
  href: string;
  icon: ReactNode;
};

function SocialLink({ link }: { link: SocialLink }) {
  return (
    <a
      title={link.title}
      href={link.href}
      className="rounded-full bg-gray-800 h-10 w-10 flex justify-center items-center dark:bg-white"
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
  const { theme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <div className="shadow-md">
      <div className="w-full py-8 bg-white dark:bg-gray-800 relative">
        <div className="max-w-6xl px-8 mx-auto flex flex-col items-center sm:flex-row sm:space-x-12">
          <div className="h-32 w-32 sm:h-48 sm:w-48 rounded-full overflow-hidden">
            <Image className="" alt="Picture of Mike Upton" src={avatarImage} />
          </div>
          <div className="flex flex-col justify-center items-center pt-6 sm:py-0 sm:items-start space-y-1">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-700 dark:text-white">
              {fullName}
            </h2>
            <p className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400">
              {currentRole}
            </p>
            <div className="flex space-x-4 pt-1">
              {socialLinks.map((link) => (
                <SocialLink key={link.title} link={link} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="z-20 absolute top-8 right-8">
        <ThemeToggle />
      </div>
    </div>
  );
}
