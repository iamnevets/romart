import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CartDrawer } from "@/components/cart";

// Distinctive serif for headlines - elegant, premium feel
const dmSerif = DM_Serif_Display({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

// Modern, characterful sans-serif for body text
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for prices and technical details
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Romart Electronics | Quality Appliances for Your Home",
    template: "%s | Romart Electronics",
  },
  description:
    "Shop quality electronics and home appliances - fridges, stoves, air conditioners, and more. Free delivery and warranty included.",
  keywords: [
    "electronics",
    "appliances",
    "fridges",
    "stoves",
    "air conditioners",
    "home appliances",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
