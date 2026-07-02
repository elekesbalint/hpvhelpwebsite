import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Akciós termékek",
  description:
    "Aktuális akciók és kedvezményes HPV öntesztek, szűrések és étrend-kiegészítők a HPVhelp webáruházban.",
  path: "/akcios-termekek",
});

export default function AkciosTermekekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
