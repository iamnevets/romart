import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Shield, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header, Footer, Container } from "@/components/layout";
import { ProductCard } from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { fetchProducts, fetchCategories, getProductPrice, isProductInStock, getCompareAtPrice, isNewProduct } from "@/lib/api";

// Helper for category descriptions
function getCategoryDescription(handle: string): string {
  const descriptions: Record<string, string> = {
    fridges: "Keep your food fresh",
    stoves: "Cook with confidence",
    "air-conditioners": "Stay cool all year",
    "washing-machines": "Clean clothes, easy life",
    microwaves: "Quick meals made easy",
    dishwashers: "Sparkling clean dishes",
  };
  return descriptions[handle] || "Quality appliances";
}

// Static category display data (images/gradients for visual design)
const categoryDisplay: Record<string, { gradient: string; image: string }> = {
  fridges: {
    gradient: "from-blue-500/20 to-cyan-500/10",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop",
  },
  stoves: {
    gradient: "from-orange-500/20 to-red-500/10",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
  },
  "air-conditioners": {
    gradient: "from-sky-500/20 to-indigo-500/10",
    image: "https://images.unsplash.com/photo-1631567091046-be2e7e0c8b96?w=400&h=300&fit=crop",
  },
  "washing-machines": {
    gradient: "from-violet-500/20 to-purple-500/10",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop",
  },
  microwaves: {
    gradient: "from-amber-500/20 to-yellow-500/10",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=300&fit=crop",
  },
  dishwashers: {
    gradient: "from-emerald-500/20 to-teal-500/10",
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=300&fit=crop",
  },
};

const features = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "On orders over GHS 500",
  },
  {
    icon: Shield,
    title: "Warranty",
    description: "1-2 year manufacturer warranty",
  },
  {
    icon: Clock,
    title: "Same Day Delivery",
    description: "Order before 2pm",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team",
  },
];

export default async function HomePage() {
  // Fetch categories and products from Medusa API
  const [categoriesData, productsData] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 4 }),
  ]);

  // Map categories with display data
  const categories = categoriesData.slice(0, 4).map((cat) => ({
    ...cat,
    href: `/products?category=${cat.handle}`,
    description: getCategoryDescription(cat.handle),
    gradient: categoryDisplay[cat.handle]?.gradient || "from-gray-500/20 to-gray-500/10",
    image: categoryDisplay[cat.handle]?.image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  }));

  // Map products to card props
  const featuredProducts: ProductCardProps[] = productsData.products.map((product) => ({
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    price: getProductPrice(product),
    compareAtPrice: getCompareAtPrice(product),
    currency: "GHS",
    handle: product.handle,
    inStock: isProductInStock(product),
    isNew: isNewProduct(product),
    variantId: product.variants[0]?.id,
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section - Bold, warm gradient with geometric accents */}
        <section className="relative overflow-hidden bg-hero-gradient grain">
          {/* Decorative geometric shapes */}
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-secondary/10 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rotate-45 border-2 border-primary/20 opacity-50" />

          <Container className="relative z-10 py-20 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4 animate-fade-up">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
                    Premium Home Appliances
                  </p>
                  <h1 className="text-foreground leading-[1.1]">
                    Quality Electronics for Your{" "}
                    <span className="text-primary italic">Home</span>
                  </h1>
                </div>

                <p className="text-lg text-muted-foreground max-w-lg animate-fade-up delay-100 opacity-0">
                  Discover our curated selection of fridges, stoves, air
                  conditioners, and more. Every purchase backed by warranty and
                  complimentary delivery across Ghana.
                </p>

                <div className="flex flex-wrap gap-4 animate-fade-up delay-200 opacity-0">
                  <Link href="/products">
                    <Button size="lg" className="gap-2 btn-glow shadow-warm-lg h-14 px-8 text-base">
                      Shop Now
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2">
                      Our Story
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-4 animate-fade-up delay-300 opacity-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-muted-foreground">Free Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-muted-foreground">2 Year Warranty</span>
                  </div>
                </div>
              </div>

              {/* Hero Image Area */}
              <div className="hidden md:block relative animate-scale-in delay-200 opacity-0">
                <div className="relative aspect-square max-w-lg mx-auto">
                  {/* Decorative rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                  <div className="absolute inset-8 rounded-full border border-primary/10" />
                  <div className="absolute inset-16 rounded-full border border-primary/5" />

                  {/* Main image container */}
                  <div className="absolute inset-12 rounded-3xl shadow-warm-xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
                      alt="Modern kitchen with premium appliances"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -left-4 bg-card shadow-warm-lg rounded-2xl p-4 border">
                    <p className="text-xs text-muted-foreground">Starting from</p>
                    <p className="text-2xl font-heading text-primary">GHS 350</p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Features Strip */}
        <section className="py-8 border-y bg-card/50">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-warm-sm">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Categories Section */}
        <section className="py-20 grain">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
                  Browse
                </p>
                <h2>Shop by Category</h2>
                <p className="text-muted-foreground max-w-md">
                  Find exactly what you need for your home
                </p>
              </div>
              <Link href="/products" className="hidden md:block">
                <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                  View All Categories
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="group relative overflow-hidden card-hover border-0 shadow-warm">
                    <div className="relative aspect-[4/3]">
                      {/* Category image */}
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />

                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-60`} />

                      {/* Pattern overlay */}
                      <div className="absolute inset-0 pattern-kente opacity-30" />

                      {/* Bottom gradient for text readability */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-heading text-lg text-white group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-white/80">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  View All Categories
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* Featured Products */}
        <section className="py-20 bg-muted/30">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.15em] text-primary font-medium">
                  Featured
                </p>
                <h2>Popular Products</h2>
                <p className="text-muted-foreground max-w-md">
                  Our most loved appliances, chosen by customers like you
                </p>
              </div>
              <Link href="/products" className="hidden md:block">
                <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                  View All Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  View All Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* CTA Section - Bold, memorable */}
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 pattern-kente opacity-20" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />

          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-primary-foreground leading-tight">
                Need Help Choosing the Right Appliance?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
                Our expert team is here to help you find the perfect electronics
                for your home. Get personalized recommendations today.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-card text-primary hover:bg-card/90 shadow-warm-lg h-14 px-8 text-base"
                  >
                    Contact Our Experts
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-14 px-8 text-base"
                  >
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
