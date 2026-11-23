import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/shop/product-page";
import { getLocale } from "@/lib/i18n/server";
import { getProduct, PRODUCTS } from "@/lib/shop/catalog";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  const locale = await getLocale();
  return { title: p ? p.title[locale] : "Loopera" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
