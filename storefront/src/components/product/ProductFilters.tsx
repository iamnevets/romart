"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/lib/use-categories";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
];

interface ProductFiltersProps {
  totalProducts?: number;
}

export function ProductFilters({ totalProducts }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories: fetchedCategories, isLoading: categoriesLoading } = useCategories();

  // Transform fetched categories to select options format
  const categories = useMemo(() => {
    const defaultOption = { value: "all", label: "All Categories" };
    const categoryOptions = fetchedCategories.map((cat) => ({
      value: cat.handle,
      label: cat.name,
    }));
    return [defaultOption, ...categoryOptions];
  }, [fetchedCategories]);

  const currentCategory = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "featured";
  const minPrice = parseInt(searchParams.get("minPrice") || "0");
  const maxPrice = parseInt(searchParams.get("maxPrice") || "500000");

  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceRange[0] > 0) {
      params.set("minPrice", priceRange[0].toString());
    } else {
      params.delete("minPrice");
    }
    if (priceRange[1] < 500000) {
      params.set("maxPrice", priceRange[1].toString());
    } else {
      params.delete("maxPrice");
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/products");
    setPriceRange([0, 500000]);
  };

  const hasActiveFilters =
    currentCategory !== "all" ||
    currentSort !== "featured" ||
    minPrice > 0 ||
    maxPrice < 500000;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading categories...</span>
          </div>
        ) : (
          <Select
            value={currentCategory}
            onValueChange={(value) => updateFilters("category", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {/* Price Filter */}
      <div className="space-y-4">
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          min={0}
          max={500000}
          step={1000}
          onValueChange={(values) => setPriceRange(values as number[])}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>GHS {(priceRange[0] / 100).toFixed(0)}</span>
          <span>GHS {(priceRange[1] / 100).toFixed(0)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={applyPriceFilter}
        >
          Apply Price Filter
        </Button>
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={currentSort}
          onValueChange={(value) => updateFilters("sort", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <p className="text-sm text-muted-foreground">
          {totalProducts !== undefined && `${totalProducts} products`}
        </p>
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="gap-2" />}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar Filter */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Filters</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
