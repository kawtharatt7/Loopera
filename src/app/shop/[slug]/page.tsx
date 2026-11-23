import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductDetail } from "@/components/shop/product-detail";
import { DEMO_PRODUCTS, getProduct } from "@/lib/demo/products";

export function generateStaticParams() {
  return DEMO_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return { title: p ? p.title : "Piece not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-16">
        <ProductDetail product={product} />
      </main>
    </>
  );
}
