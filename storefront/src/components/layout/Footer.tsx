import Link from "next/link";
import { Container } from "./Container";

const footerLinks = {
  shop: [
    { name: "All Products", href: "/products" },
    { name: "Refrigerators & Freezers", href: "/products?category=fridges" },
    { name: "Ovens & Cookers", href: "/products?category=ovens-cookers" },
    { name: "Air Conditioners", href: "/products?category=air-conditioners" },
    { name: "Washing Machines", href: "/products?category=washing-machines" },
    { name: "Small Appliances", href: "/products?category=small-appliances" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Delivery Information", href: "/delivery" },
    { name: "Returns & Refunds", href: "/returns" },
    { name: "Warranty", href: "/warranty" },
    { name: "FAQ", href: "/faq" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Store Locations", href: "/locations" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <Container>
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block">
                <span className="text-xl font-bold text-primary">Romart</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                Quality home appliances for your home. Free delivery on orders
                over GHS 500.
              </p>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Romart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Secure payments with
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              {/* Payment icons placeholder */}
              <span className="text-xs font-medium px-2 py-1 border rounded">
                Paystack
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
