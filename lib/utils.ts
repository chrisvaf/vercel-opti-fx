import { type ClassValue, clsx } from "clsx";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { twMerge } from "tailwind-merge";
import { products } from "./products";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { plpFlag } from "./flags";
import { get } from "@vercel/edge-config";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductsFromCookie(cookieStore:ReadonlyRequestCookies) {
  let myProducts = products;

  /*const flag = await plpFlag();

  if (flag != null && flag.productSource === "edge_config") {
    const catalog = await get("catalog") as any;
      myProducts = catalog.products as typeof products;
  }*/

  const cart = cookieStore?.get("cart");
  const cartProductIds = cart?.value
    ? (JSON.parse(cart.value) as string[])
    : [];
  return cartProductIds.map((id) => ({
    ...myProducts.filter((p) => p.id === id)[0],
  }));
}

export function getShopperFromHeaders(
  headers: ReadonlyHeaders
): string | "default" {
  const cookieString = headers.get("cookie");
  if (!cookieString) {
    return "default";
  }
  const cookies = cookieString.split("; ");
  const cookie = cookies.find((cookie: any) =>
    cookie.startsWith("shopper" + "=")
  );
  return cookie ? cookie.split("=")[1] : "default";
}

export function formatUSD(amount: number) {
  return formatter.format(amount);
}
