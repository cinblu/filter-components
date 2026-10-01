import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { siteSettingsScript } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

const description =
  "A filtering framework for data-heavy products: filters people can see, find and undo, in one row above your data. Install it with the shadcn CLI.";

export const metadata: Metadata = {
  title: { default: "Filter Bar: a filtering framework for data-heavy products", template: "%s · Filter Bar" },
  description,
  // Absolute URLs for the social image. Set NEXT_PUBLIC_SITE_URL in production; on Vercel,
  // Next.js falls back to the deployment URL by itself.
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  openGraph: {
    type: "website",
    siteName: "Filter Bar",
    title: "Filter Bar: a filtering framework for data-heavy products",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Filter Bar: a filtering framework for data-heavy products",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable, geistMono.variable)}
      // The settings script below sets the theme class and accent before React hydrates.
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased">
        {/* Applies the saved theme and accent before the page paints (no flash). */}
        <Script id="site-settings" strategy="beforeInteractive">
          {siteSettingsScript}
        </Script>
        <TooltipProvider>
          <SiteHeader />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
