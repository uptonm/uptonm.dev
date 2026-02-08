import "@/styles/globals.css";
import { copy } from "@/lib/copy";
import { ThemeProvider } from "@uptonm/ui/components/utils/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";

import { Noto_Sans, Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const noto_sans = Noto_Sans({
  weight: ["400"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: copy.seo.title,
  applicationName: "uptonm.dev",
  description: copy.seo.description,
  keywords: copy.seo.keywords,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${noto_sans.variable}`}>
      <body className="relative min-h-screen overflow-x-hidden">
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-[250px] -right-[200px] h-[600px] w-[600px] rounded-full bg-violet-500/20 dark:bg-violet-500/30 blur-[120px] animate-float-1 will-change-transform" />
          <div className="absolute -bottom-[250px] -left-[200px] h-[600px] w-[600px] rounded-full bg-blue-500/15 dark:bg-blue-500/25 blur-[120px] animate-float-2 will-change-transform" />
          <div className="hidden md:block absolute top-1/3 left-1/2 h-[500px] w-[500px] rounded-full bg-cyan-400/10 dark:bg-cyan-400/15 blur-[100px] animate-float-3 will-change-transform" />
          <div className="hidden lg:block absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/15 blur-[100px] animate-float-1 will-change-transform [animation-delay:-7s]" />
        </div>

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>

        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
