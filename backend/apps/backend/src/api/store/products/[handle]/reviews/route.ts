import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getProductReviews,
  addReview,
  hasUserReviewed,
  getReviewStats,
  type Review,
} from "../../../../../lib/reviews-storage";

interface CreateReviewBody {
  rating: number;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
}

/**
 * GET /store/products/:handle/reviews
 *
 * Retrieves all reviews for a product.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { handle } = req.params;

  try {
    const reviews = getProductReviews(handle);
    const stats = getReviewStats(handle);

    return res.status(200).json({
      success: true,
      productHandle: handle,
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating,
      ratingDistribution: stats.ratingDistribution,
      reviews: reviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
}

/**
 * POST /store/products/:handle/reviews
 *
 * Creates a new review for a product.
 */
export async function POST(
  req: MedusaRequest<CreateReviewBody>,
  res: MedusaResponse
) {
  const { handle } = req.params;
  const { rating, title, content, authorName, authorEmail } = req.body;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Review title must be at least 3 characters",
    });
  }

  if (!content || content.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: "Review content must be at least 10 characters",
    });
  }

  if (!authorName || !authorEmail) {
    return res.status(400).json({
      success: false,
      message: "Author name and email are required",
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(authorEmail)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  try {
    // Check if user already reviewed this product
    const normalizedEmail = authorEmail.toLowerCase().trim();
    if (hasUserReviewed(handle, normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const now = new Date().toISOString();
    const review: Review = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productHandle: handle,
      rating,
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim(),
      authorEmail: normalizedEmail,
      verified: false, // TODO: Check if user purchased the product
      helpful: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Add new review (persisted to disk)
    addReview(review);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Failed to create review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
    });
  }
}
