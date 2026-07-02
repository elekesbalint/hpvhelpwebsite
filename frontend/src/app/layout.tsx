import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import JsonLd from "@/components/seo/JsonLd";
import SiteAnalytics from "@/components/analytics/SiteAnalytics";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl, SITE_DEFAULT_TITLE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultSeo = buildPageMetadata({
  absoluteTitle: SITE_DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: `%s – ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Sunmed Kft." }],
  creator: "Sunmed Kft.",
  publisher: "Sunmed Kft.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: defaultSeo.alternates,
  openGraph: defaultSeo.openGraph,
  twitter: defaultSeo.twitter,
  robots: defaultSeo.robots,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex min-w-0 flex-col overflow-x-clip" suppressHydrationWarning>
        <JsonLd data={buildOrganizationJsonLd()} />
        <SiteAnalytics />
        {children}
      </body>
    </html>
  );
}
