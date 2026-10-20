import "../dist/styles.css";
import "./admin.css";

export const metadata = {
  title: "K-Market Online Shopper",
  description: "Simple finds and easy shopping from K-Market Online Shopper.",
  icons: { icon: "/assets/kmos-logo.png" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="motion-ready">{children}</body>
    </html>
  );
}
