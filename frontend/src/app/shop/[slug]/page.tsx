import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsClient from "@/app/shop/[slug]/ProductDetailsClient";
import JsonLd from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, stripHtmlForMeta } from "@/lib/seo/metadata";
import { fetchProductWithCategoryBySlug } from "@/lib/seo/product-fetch";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProductWithCategoryBySlug(slug);
  if (!data) {
    return buildPageMetadata({
      title: "Termék nem található",
      description: "A keresett termék nem érhető el a HPVhelp webáruházban.",
      path: `/shop/${slug}`,
      noIndex: true,
    });
  }

  const { product } = data;
  const description = product.description
    ? stripHtmlForMeta(product.description, 155)
    : `${product.name} megvásárolható a HPVhelp hivatalos webáruházában. Gyors szállítás, megbízható laboratóriumi háttér.`;

  const image = product.image_url ?? DEFAULT_OG_IMAGE_PATH;

  return buildPageMetadata({
    title: product.name,
    description,
    path: `/shop/${product.slug}`,
    image,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchProductWithCategoryBySlug(slug);
  if (!data) notFound();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Főoldal", path: "/" },
    { name: data.product.name, path: `/shop/${data.product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[buildProductJsonLd(data), breadcrumb]} />
      <ProductDetailsClient
        slug={slug}
        initialProduct={data.product}
        initialCategory={data.category}
      />
    </>
  );
}
