import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site";

export type PageMetadataInput = {
  /** Short page title (site name is appended via root template unless absoluteTitle is set). */
  title?: string;
  /** Full title override – skips the title template. */
  absoluteTitle?: string;
  description?: string;
  /** Path starting with / (e.g. `/rolunk`). */
  path?: string;
  /** Relative (/…) or absolute image URL for social cards. */
  image?: string | null;
  noIndex?: boolean;
};

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`;
}

export function stripHtmlForMeta(text: string, maxLength = 160): string {
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  const slice = plain.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}…`;
}

export function buildPageMetadata(input: PageMetadataInput = {}): Metadata {
  const description = input.description ?? SITE_DESCRIPTION;
  const canonicalPath = input.path ?? "/";
  const canonical = toAbsoluteUrl(canonicalPath);
  const imagePath = input.image ?? DEFAULT_OG_IMAGE_PATH;
  const imageUrl = toAbsoluteUrl(imagePath);

  const title = input.absoluteTitle
    ? { absolute: input.absoluteTitle }
    : input.title
      ? input.title
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "hu_HU",
      url: canonical,
      siteName: SITE_NAME,
      title: input.absoluteTitle ?? (input.title ? `${input.title} – ${SITE_NAME}` : SITE_DEFAULT_TITLE),
      description,
      images: [
        {
          url: imageUrl,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.absoluteTitle ?? (input.title ? `${input.title} – ${SITE_NAME}` : SITE_DEFAULT_TITLE),
      description,
      images: [imageUrl],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
