export type FeedbackCategory =
  | "general" | "product" | "service"
  | "facility" | "suggestion" | "complaint";

export interface FeedbackItem {
  feedbackId:       number;
  userId:           number;
  residentName:     string;
  initials:         string;
  rating:           number;
  feedback:         string | null;
  feedbackCategory: FeedbackCategory | null;
  submittedAt:      string;
}

// ── What the list endpoint will return ──────────────────────────────────────
export interface FeedbackListResponse {
  data:       FeedbackItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ── Query params shape (mirrors what you'll send to the API) ────────────────
export interface FeedbackFilters {
  search?:   string;
  category?: FeedbackCategory | "all";
  rating?:   number;
  sortBy?:   string;
  page?:     number;
  pageSize?: number;
}

export const CATEGORY_STYLES: Record<FeedbackCategory, { bg: string; text: string }> = {
  general:    { bg: "#E6F1FB", text: "#185FA5" },
  product:    { bg: "#EAF3DE", text: "#3B6D11" },
  service:    { bg: "#EEEDFE", text: "#534AB7" },
  facility:   { bg: "#E1F5EE", text: "#0F6E56" },
  suggestion: { bg: "#FAEEDA", text: "#854F0B" },
  complaint:  { bg: "#FCEBEB", text: "#A32D2D" },
};

export const AVATAR_PALETTE = [
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAECE7", text: "#993C1D" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#FBEAF0", text: "#993556" },
];

export const PAGE_SIZE = 5;

export const CATEGORY_OPTIONS: ({ value: FeedbackCategory | "all"; label: string })[] = [
  { value: "all",        label: "All" },
  { value: "general",    label: "General" },
  { value: "product",    label: "Product" },
  { value: "service",    label: "Service" },
  { value: "facility",   label: "Facility" },
  { value: "suggestion", label: "Suggestion" },
  { value: "complaint",  label: "Complaint" },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest",      label: "Newest first" },
  { value: "oldest",      label: "Oldest first" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "rating_asc",  label: "Lowest rated" },
];