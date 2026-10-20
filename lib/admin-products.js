import { productGroups, products } from "@/lib/products";

function placementFor(id) {
  if (productGroups.limited.includes(id)) return "limited";
  if (productGroups.sale.includes(id)) return "sale";
  return "popular";
}

export const adminSeedProducts = Object.entries(products).map(([id, product]) => {
  const placement = placementFor(id);
  const order = productGroups[placement].indexOf(id) + 1;
  return {
    id,
    name: product.name,
    price: product.price,
    description: product.description,
    category: product.category.replace(" · SALE", ""),
    brand: "KMOS",
    sortOrder: order,
    placement,
    saleTag: placement === "sale" ? "SALE" : "",
    limitedTag: placement === "limited" ? "LOW STOCK" : "",
    ordersUntil: product.ordersUntil ?? "",
    images: [],
    sizes: product.sizes,
    colorwayEnabled: product.colors.length > 0,
    colorways: product.colors.map(([name, , hex]) => ({ name, color: hex, images: [] })),
    status: "active"
  };
});
