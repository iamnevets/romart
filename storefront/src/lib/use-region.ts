"use client";

import { useState, useEffect } from "react";
import { medusa } from "./medusa";

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: { iso_2: string; name: string }[];
}

interface UseRegionResult {
  region: Region | null;
  isLoading: boolean;
  error: Error | null;
}

// Fallback region for Ghana
const FALLBACK_REGION: Region = {
  id: "fallback-gh",
  name: "Ghana",
  currency_code: "ghs",
  countries: [{ iso_2: "gh", name: "Ghana" }],
};

// Cache region
let cachedRegion: Region | null = null;

export function useRegion(): UseRegionResult {
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRegion = async () => {
      // Return cached region if available
      if (cachedRegion) {
        setRegion(cachedRegion);
        setIsLoading(false);
        return;
      }

      try {
        const response = await medusa.store.region.list();

        // Find Ghana region or use first available
        const ghRegion = response.regions.find(
          (r: { countries?: { iso_2: string }[] }) =>
            r.countries?.some((c) => c.iso_2.toLowerCase() === "gh")
        );

        const selectedRegion = ghRegion || response.regions[0];

        if (selectedRegion) {
          const mappedRegion: Region = {
            id: selectedRegion.id,
            name: selectedRegion.name,
            currency_code: selectedRegion.currency_code,
            countries: selectedRegion.countries?.map((c: { iso_2: string; name: string }) => ({
              iso_2: c.iso_2,
              name: c.name,
            })) || [],
          };
          cachedRegion = mappedRegion;
          setRegion(mappedRegion);
        } else {
          setRegion(FALLBACK_REGION);
        }
      } catch (err) {
        console.warn("Failed to fetch region, using fallback:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch region"));
        setRegion(FALLBACK_REGION);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegion();
  }, []);

  return { region, isLoading, error };
}

// Get region ID for API calls
export function getRegionId(): string {
  return cachedRegion?.id || FALLBACK_REGION.id;
}
