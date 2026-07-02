import type { Metadata } from "next";
import HomePageClient from "@/app/HomePageClient";
import JsonLd from "@/components/seo/JsonLd";
import { buildWebSiteJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  absoluteTitle: "HPVhelp – HPV szűrés, öntesztek és étrend-kiegészítők",
  description: SITE_DESCRIPTION,
  path: "/",
  image: "/branding/hero-home.jpg",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildWebSiteJsonLd()} />
      <HomePageClient />
    </>
  );
}
