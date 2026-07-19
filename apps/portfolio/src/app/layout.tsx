import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { copy } from "@/lib/copy";
import { ThemeProvider } from "@uptonm/ui/components/utils/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
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
  alternates: { canonical: "/" },
  title: copy.seo.title,
  applicationName: "uptonm.dev",
  description: copy.seo.description,
  keywords: copy.seo.keywords,
  authors: [{ name: copy.brand.name, url: copy.brand.url }],
  creator: copy.brand.name,
  publisher: copy.brand.name,
  category: "technology",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: copy.brand.url,
    siteName: "uptonm.dev",
    title: copy.seo.title,
    description: copy.seo.description,
    images: [
      {
        url: new URL("/og.jpg", copy.brand.url).toString(),
        width: 1200,
        height: 630,
        alt: "Mike Upton — software engineer across products, systems, and AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
    images: [new URL("/og.jpg", copy.brand.url).toString()],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: copy.brand.name,
  url: copy.brand.url,
  jobTitle: "Software Engineer",
  homeLocation: {
    "@type": "Place",
    name: copy.home.location,
  },
  sameAs: copy.socials.map((social) => social.href),
  knowsAbout: copy.seo.keywords,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/*
        The document itself must never scroll: on iOS Safari the page canvas
        paints full-bleed into the status-bar/notch strip above the layout
        viewport, so any document scroll shows content there. Scrolling lives
        in #scroll-root instead, which clips its content at its own top edge.
      */}
      <body className="h-dvh overflow-hidden">
        <ClerkProvider appearance={clerkAppearance}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand focus:outline-none"
          >
            Skip to main content
          </a>
          <ThemeProvider>
            <div
              id="scroll-root"
              className="h-full overflow-x-hidden overflow-y-auto scroll-smooth"
            >
              {children}
            </div>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}