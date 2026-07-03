import "@/styles/globals.css";
import { copy } from "@/lib/copy";
import { ThemeProvider } from "@uptonm/ui/components/utils/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(copy.brand.url),
  title: copy.seo.title,
  applicationName: "uptonm.dev",
  description: copy.seo.description,
  keywords: copy.seo.keywords,
  authors: [{ name: copy.brand.name, url: copy.brand.url }],
  creator: copy.brand.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: copy.brand.url,
    siteName: "uptonm.dev",
    title: copy.seo.title,
    description: copy.seo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
  },
  icons: { icon: "/favicon.ico" },
};

// Set the theme class before first paint to avoid a flash of the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand focus:outline-none"
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
