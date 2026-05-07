import * as fs from "fs";
import * as path from "path";

/**
 * File-based persistent storage for product reviews.
 * Reviews are stored in a JSON file that persists across server restarts.
 *
 * For production with high traffic, consider migrating to:
 * - A dedicated database table via Medusa module extension
 * - Redis for caching with database backing
 */

export interface Review {
  id: string;
  productHandle: string;
  rating: number; // 1-5
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  verified: boolean; // Whether the reviewer purchased the product
  helpful: number; // Helpful vote count
  createdAt: string;
  updatedAt: string;
}

interface ReviewsData {
  [productHandle: string]: Review[];
}

// Storage file path - in the backend data directory
const STORAGE_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = path.join(STORAGE_DIR, "reviews.json");

/**
 * Ensure the storage directory exists
 */
function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Load all reviews from disk
 */
function loadReviews(): ReviewsData {
  ensureStorageDir();

  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load reviews from disk:", error);
  }

  return {};
}

/**
 * Save all reviews to disk
 */
function saveReviews(data: ReviewsData): void {
  ensureStorageDir();

  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save reviews to disk:", error);
    throw error;
  }
}

// In-memory cache for performance (backed by file storage)
let reviewsCache: ReviewsData | null = null;

/**
 * Get cached reviews, loading from disk if needed
 */
function getReviewsCache(): ReviewsData {
  if (reviewsCache === null) {
    reviewsCache = loadReviews();
  }
  return reviewsCache;
}

/**
 * Get all reviews for a product
 */
export function getProductReviews(productHandle: string): Review[] {
  const cache = getReviewsCache();
  return cache[productHandle] || [];
}

/**
 * Add a new review for a product
 */
export function addReview(review: Review): void {
  const cache = getReviewsCache();

  if (!cache[review.productHandle]) {
    cache[review.productHandle] = [];
  }

  cache[review.productHandle].push(review);
  saveReviews(cache);
}

/**
 * Check if a user has already reviewed a product
 */
export function hasUserReviewed(productHandle: string, authorEmail: string): boolean {
  const reviews = getProductReviews(productHandle);
  return reviews.some(
    (r) => r.authorEmail.toLowerCase() === authorEmail.toLowerCase()
  );
}

/**
 * Get review by ID
 */
export function getReviewById(reviewId: string): Review | null {
  const cache = getReviewsCache();

  for (const reviews of Object.values(cache)) {
    const review = reviews.find((r) => r.id === reviewId);
    if (review) return review;
  }

  return null;
}

/**
 * Update a review
 */
export function updateReview(reviewId: string, updates: Partial<Review>): Review | null {
  const cache = getReviewsCache();

  for (const productHandle of Object.keys(cache)) {
    const reviewIndex = cache[productHandle].findIndex((r) => r.id === reviewId);

    if (reviewIndex !== -1) {
      cache[productHandle][reviewIndex] = {
        ...cache[productHandle][reviewIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveReviews(cache);
      return cache[productHandle][reviewIndex];
    }
  }

  return null;
}

/**
 * Delete a review
 */
export function deleteReview(reviewId: string): boolean {
  const cache = getReviewsCache();

  for (const productHandle of Object.keys(cache)) {
    const reviewIndex = cache[productHandle].findIndex((r) => r.id === reviewId);

    if (reviewIndex !== -1) {
      cache[productHandle].splice(reviewIndex, 1);
      saveReviews(cache);
      return true;
    }
  }

  return false;
}

/**
 * Increment helpful vote count for a review
 */
export function voteHelpful(reviewId: string): Review | null {
  const review = getReviewById(reviewId);

  if (review) {
    return updateReview(reviewId, { helpful: review.helpful + 1 });
  }

  return null;
}

/**
 * Get review statistics for a product
 */
export function getReviewStats(productHandle: string): {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
} {
  const reviews = getProductReviews(productHandle);

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    totalReviews: reviews.length,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
  };
}

/**
 * Clear the in-memory cache (useful for testing)
 */
export function clearCache(): void {
  reviewsCache = null;
}
