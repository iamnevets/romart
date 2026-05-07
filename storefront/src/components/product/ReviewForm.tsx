"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStars } from "./ReviewStars";

interface ReviewFormProps {
  productHandle: string;
  onSubmitSuccess?: () => void;
}

export function ReviewForm({ productHandle, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
      const response = await fetch(
        `${backendUrl}/store/products/${productHandle}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            title,
            content,
            authorName,
            authorEmail,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit review");
      }

      setSuccess(true);
      setRating(0);
      setTitle("");
      setContent("");
      setAuthorName("");
      setAuthorEmail("");
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-success/50 bg-success/10 p-6 text-center">
        <h4 className="font-semibold text-success mb-2">Thank you for your review!</h4>
        <p className="text-sm text-muted-foreground">
          Your review has been submitted successfully.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          Write Another Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-semibold">Write a Review</h4>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="text-sm font-medium mb-2 block">Your Rating *</label>
        <ReviewStars
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="text-sm font-medium mb-2 block">
          Review Title *
        </label>
        <Input
          id="review-title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="review-content" className="text-sm font-medium mb-2 block">
          Your Review *
        </label>
        <Textarea
          id="review-content"
          placeholder="Tell others about your experience with this product"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          required
          minLength={10}
          rows={4}
        />
      </div>

      {/* Author Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="author-name" className="text-sm font-medium mb-2 block">
            Your Name *
          </label>
          <Input
            id="author-name"
            placeholder="John Doe"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="author-email" className="text-sm font-medium mb-2 block">
            Your Email *
          </label>
          <Input
            id="author-email"
            type="email"
            placeholder="john@example.com"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email won&apos;t be displayed publicly
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="gap-2">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Review
          </>
        )}
      </Button>
    </form>
  );
}
