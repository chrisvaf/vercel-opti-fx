export const dynamic = "force-dynamic";
import ProductsListing from "@/components/products";
import { plpFlag } from "@/lib/flags";
import { products } from "@/lib/products";
import { Suspense } from "react";

export default async function ProductsPage() {
    let sortField = "title";
    let productSource = "local";

    const flag = await getPlpFlag();

    if (flag != null && flag.enabled) {
        if (flag.sortField != null) {
            sortField = flag.sortField;
        }

        if (flag.productSource != null) {
            productSource = flag.productSource;
        }
    }

    return (
    <main className="max-w-5xl mx-auto py-6 px-4 md:px-6">
      <h1 className="font-bold text-3xl lg:text-4xl">Products</h1>
      <section className="grid grid-cols-1 gap-6 lg:gap-12 items-start py-4 md:py-8 lg:py-12">
        <div className="flex flex-col gap-y-2">
            <Suspense fallback>
                <ProductsListing sortField={sortField} productSource={productSource}  />
            </Suspense>
        </div>
      </section>
    </main>
    );
}

async function getPlpFlag() {
    const flag = await plpFlag();
    return flag;
}