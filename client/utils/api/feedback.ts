import api from "../api";
import type { FeedbackFilters, FeedbackListResponse } from "@/utils/types/feedback";

export async function fetchFeedback(filters: FeedbackFilters): Promise<FeedbackListResponse> {
  const res = await api.get<FeedbackListResponse>("/feedback", {
    params: {
      search:   filters.search   ?? "",
      category: filters.category ?? "all",
      rating:   filters.rating   ?? 0,
      sortBy:   filters.sortBy   ?? "newest",
      status:   filters.status   ?? "new",
      page:     filters.page     ?? 1,
      pageSize: filters.pageSize ?? 5,
    },
  });
  return res.data;
}

export async function fetchFeedbackStats() {
  const res = await api.get("/feedback/stats");
  return res.data;
}

export async function exportAllFeedback() {
  const res = await api.get("/feedback/export");
  return res.data;
}

export async function markFeedbackReviewed(feedbackId: number) {
  const res = await api.patch(`/feedback/${feedbackId}/status`, { status: "reviewed" });
  return res.data;
}

export async function unmarkFeedbackReviewed(feedbackId: number) {
  const res = await api.patch(`/feedback/${feedbackId}/status`, { status: "new" });
  return res.data;
}