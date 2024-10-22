import { products } from "@/lib/products";
import ProductCard from "./product-card";
import relatedProducts from "./related-products";
import { get } from "@vercel/edge-config";

export default async function ProductsListing({ sortField, productSource }: { sortField: string, productSource: string }) {
    var myProducts = [];

    if (productSource == "edge_config") {
        const catalog = await get("catalog") as any;
        myProducts = catalog.products as typeof products;
    }
    else {
        myProducts = products;
    }

    var sortedProducts = myProducts.sort((p1, p2) => {
        if (sortField == "price_descending") {
            return p2.price - p1.price;
        }
        else if (sortField == "price_ascending") {
            return p1.price - p2.price;
        }
        else {
            if (p1.title > p2.title) {
                return 1;
            }

            if (p1.title < p2.title) {
                return -1;
            }

            return 0;
        }
    });

    return (
        <section className="flex flex-col w-full justify-center py-6 space-y-4 md:py-8 lg:py-12">
        <h2 className="font-bold text-2xl">Related Products</h2>
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          {((sortedProducts.map((product) => {
            return <ProductCard key={product.slug} product={product} />;
          })))}
        </div>
      </section>  
    );
}