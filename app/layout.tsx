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

export const metadata: Metadata = {
  title: { default: "Filter Bar", template: "%s · Filter Bar" },
  description:
    "A filter toolbar for data-heavy tables: applied filters stay visible, key filters stay one click away, and the data keeps the screen. Install it with the shadcn CLI.",
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
