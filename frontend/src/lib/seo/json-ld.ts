import { COMPANY_CONTACT } from "@/lib/company-contact";
import { getProductPricing } from "@/lib/pricing";
import { getSiteUrl, SITE_DEFAULT_TITLE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";
import { toAbsoluteUrl } from "@/lib/seo/metadata";
import type { ProductWithCategory } from "@/lib/seo/product-fetch";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_CONTACT.legalName,
    alternateName: SITE_NAME,
    url: getSiteUrl(),
    logo: toAbsoluteUrl("/branding/hpvhelp-logo.png"),
    email: COMPANY_CONTACT.email,
    telephone: COMPANY_CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_CONTACT.seat,
      addressLocality: "Pécs",
      postalCode: "7623",
      addressCountry: "HU",
    },
    sameAs: ["https://www.youtube.com/watch?v=YqcPJuCduxA"],
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: COMPANY_CONTACT.legalName,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/?q={search_term_string}#termekek`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildProductJsonLd({ product, category }: ProductWithCategory) {
  const pricing = getProductPricing(product, category);
  const price = pricing.effectivePrice;
  const inStock = (product.stock ?? 0) > 0;
  const description = product.description
    ? product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : `${product.name} – ${SITE_NAME} webáruház`;

  const images = product.image_url ? [product.image_url] : [toAbsoluteUrl("/branding/hero-home.jpg")];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: images,
    sku: product.sku ?? undefined,
    url: `${getSiteUrl()}/shop/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: `${getSiteUrl()}/shop/${product.slug}`,
      priceCurrency: "HUF",
      price: price.toFixed(0),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: COMPANY_CONTACT.legalName,
      },
    },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export { SITE_DEFAULT_TITLE };
