import optimizely from "@optimizely/optimizely-sdk";
import { unstable_flag as flag } from "@vercel/flags/next";
import { getProductsFromCookie, getShopperFromHeaders } from "./utils";
import { get } from "@vercel/edge-config";
import { cookies } from "next/headers";

export const showBuyNowFlag = flag<{
  enabled: boolean;
  buttonText?: string;
}>({
  key: "buynow",
  description: "Flag for showing Buy Now button on PDP",
  options: [
    { label: "Hide", value: { enabled: false } },
    { label: "Show", value: { enabled: true } },
  ],
  async decide({ headers }) {
    const datafile = await get("datafile");
    
    if (!datafile) {
      throw new Error("Failed to retrive datafile from Vercel Edge Config");
    }

    const client = optimizely.createInstance({
      datafile: datafile as object,
      eventDispatcher: {
        dispatchEvent: (event) => {},
      },
    });

    if (!client) {
      throw new Error("Failed to create client");
    }

    await client.onReady();

    const shopper = getShopperFromHeaders(headers);
    const context = client.createUserContext(shopper);

    if (!context) {
      throw new Error("Failed to create user context");
    }

    const decision = context.decide("buynow");
    console.log(`BuyNow decision: ${decision.enabled}`);
    const flag = {
      enabled: decision.enabled,
      buttonText: decision.variables.buynow_text as string,
    };

    return flag;
  },
});

export const showInventoryFlag = flag<{
  enabled: boolean;
  inventoryText?: string;
  showAmounts: boolean,
  textColor: string
}>({
  key: "inventory_on_pdp",
  description: "Flag to either show or hide inventory on the product detail page.",
  options: [
    { label: "Hide", value: { enabled: false, showAmounts: false, textColor: 'green' } },
    { label: "Show", value: { enabled: true, showAmounts: false, textColor: 'green' } },
    { label: "Show Amounts", value: { enabled: true, showAmounts: true, textColor: 'green' } },
    { label: "Show Amounts Red", value: { enabled: true, showAmounts: true, textColor: 'Red' } },
  ],
  async decide({ headers }) {
    const datafile = await get("datafile");

    if (!datafile) {
      throw new Error("Failed to retrive datafile from Vercel Edge Config");
    }

    const client = optimizely.createInstance({
      datafile: datafile as object,
      eventDispatcher: {
        dispatchEvent: (event) => {},
      },
    });

    if (!client) {
      throw new Error("Failed to create client");
    }

    await client.onReady();

    const shopper = getShopperFromHeaders(headers);
    const context = client.createUserContext(shopper);

    if (!context) {
      throw new Error("Failed to create user context");
    }

    const decision = context.decide("inventory_on_pdp");
    console.log(`Decision Enabled: ${decision.enabled}`);
    const flag = {
      enabled: decision.enabled,
      inventoryText: decision.variables.show_amounts ? "3 in stock" : "In stock",
      textColor: decision.variables.text_color as string,
      showAmounts: decision.variables.show_amounts as boolean
    };

    return flag;
  },
});

export const plpFlag = flag<{
  enabled: boolean;
  sortField?: string;
  productSource?: string;
}>({
  key: "plp",
  description: "A feature flag to control how products are returned in the Product Listing page.",
  options: [
    { label: "Hide", value: { enabled: false, sortField: "title", productSource: "local" } },
    { label: "Price Desc", value: { enabled: true, sortField: "price_descending", productSource: "edge_config" } },
    { label: "Price Asc", value: { enabled: true, sortField: "price_ascending", productSource: "edge_config" } },
  ],
  async decide({ headers }) {
    const datafile = await get("datafile");

    if (!datafile) {
      throw new Error("Failed to retrive datafile from Vercel Edge Config");
    }

    const client = optimizely.createInstance({
      datafile: datafile as object,
      eventDispatcher: {
        dispatchEvent: (event) => {},
      },
    });

    if (!client) {
      throw new Error("Failed to create client");
    }

    await client.onReady();

    const shopper = getShopperFromHeaders(headers);
    const context = client.createUserContext(shopper);

    if (!context) {
      throw new Error("Failed to create user context");
    }

    const decision = context.decide("plp");
    const flag = {
      enabled: decision.enabled,
      sortField: decision.variables.sort_field as string,
      productSource: decision.variables.product_source as string
    };

    return flag;
  },
});

export const showPromoBannerFlag = flag<boolean>({
  key: "showPromoBanner",
  defaultValue: false,
  description: "Flag for showing promo banner on homepage",
  options: [
    { value: false, label: "Hide" },
    { value: true, label: "Show" },
  ],
  async decide({ headers }) {
    const datafile = await get("datafile");

    if (!datafile) {
      throw new Error("Failed to retrive datafile from Vercel Edge Config");
    }

    const client = optimizely.createInstance({
      datafile: datafile as object,
      eventDispatcher: {
        dispatchEvent: (event) => {},
      },
    });

    const shopper = getShopperFromHeaders(headers);

    var cartProducts = getProductsFromCookie(cookies());
    const attributes = {
      "items_in_cart": cartProducts.length > 0
    };

    const context = client!.createUserContext(shopper, attributes);
    
    if (!context) {
      throw new Error("Failed to create user context");
    }

    const decision = context.decide("showpromo");
    return decision.enabled;
  },
});

export const precomputeFlags = [showPromoBannerFlag] as const;
