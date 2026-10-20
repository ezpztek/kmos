import Storefront from "@/components/Storefront";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/AdminPanel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { adminSeedProducts } from "@/lib/admin-products";
import { products } from "@/lib/products";

function isAdminRoute(route) {
  return route === "@dm1n" || route.toLowerCase() === "%40dm1n";
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const route = slug[0] ?? "";
  if (isAdminRoute(route)) return { title: "KMOS Admin", robots: { index: false, follow: false } };
  const product = products[route];
  if (product) return { title: `${product.name} — K-Market Online Shopper` };
  if (route === "cart") return { title: "Your Cart — K-Market Online Shopper" };
  if (route === "receipt") return { title: "Digital Receipt — K-Market Online Shopper" };
  return { title: "K-Market Online Shopper" };
}

export default async function Page({ params, searchParams }) {
  const { slug = [] } = await params;
  const route = slug[0] ?? "";
  if (isAdminRoute(route)) {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      const query = await searchParams;
      return <AdminLogin hasError={query?.error === "invalid"} />;
    }
    return <AdminPanel initialProducts={adminSeedProducts} />;
  }
  return <Storefront route={route} />;
}
