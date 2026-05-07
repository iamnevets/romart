"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ThumbsUp, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReviewStars } from "./ReviewStars";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  productHandle: string;
  rating: number;
  title: string;
  content: string;
  authorName: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ReviewsData {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  reviews: Review[];
}

interface ProductReviewsProps {
  productHandle: string;
}

export function ProductReviews({ productHandle }: ProductReviewsProps) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
      const response = await fetch(
        `${backendUrl}/store/products/${productHandle}/reviews`
      );
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        // If no reviews yet, set empty state
        setData({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Unable to load reviews");
      // Set empty state on error
      setData({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [productHandle]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews
          </h3>
          {data && data.totalReviews > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <ReviewStars rating={data.averageRating} size="md" showValue />
              <span className="text-muted-foreground">
                Based on {data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      {/* Rating Distribution */}
      {data && data.totalReviews > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-lg bg-muted/30 border">
          <div className="text-center">
            <div className="text-5xl font-heading text-primary mb-2">
              {data.averageRating.toFixed(1)}
            </div>
            <ReviewStars rating={data.averageRating} size="lg" />
            <p className="text-sm text-muted-foreground mt-2">
              {data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.ratingDistribution[stars] || 0;
              const percentage = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-12">{stars} star</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <>
          <Separator />
          <ReviewForm
            productHandle={productHandle}
            onSubmitSuccess={() => {
              setShowForm(false);
              fetchReviews();
            }}
          />
        </>
      )}

      <Separator />

      {/* Reviews List */}
      {error ? (
        <p className="text-center text-muted-foreground py-8">{error}</p>
      ) : data && data.reviews.length > 0 ? (
        <div className="space-y-6">
          {data.reviews.map((review) => (
            <div key={review.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.authorName}</span>
                      {review.verified && (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium">{review.title}</h4>
                <p className="text-muted-foreground mt-1">{review.content}</p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({review.helpful})
                </button>
              </div>

              <Separator />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-2">No reviews yet</h4>
          <p className="text-muted-foreground mb-4">
            Be the first to share your experience with this product
          </p>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Write a Review</Button>
          )}
        </div>
      )}
    </div>
  );
}
