export type RequestStatus =
  | "pending" | "approved" | "rejected" | "in_progress" | "completed";

export type RequestCategory =
  | "hygiene" | "snacks" | "drinks" | "electronics"
  | "games" | "books" | "clothing" | "other";

export interface ProductRequestItem {
  requestId:       number;
  residentName:    string;
  initials:        string;
  productName:     string;
  description:     string | null;
  requestCategory: RequestCategory | null;
  requestStatus:   RequestStatus;
  submittedAt:     string;
  updatedAt:       string | null;
}

export interface ProductRequestListResponse {
  data:       ProductRequestItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface ProductRequestFilters {
  search?:   string;
  category?: RequestCategory | "all";
  status?:   RequestStatus | "all";
  sortBy?:   string;
  page?:     number;
  pageSize?: number;
}

export const REQUEST_STATUS_OPTIONS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all",         label: "All"         },
  { value: "pending",     label: "Pending"     },
  { value: "in_progress", label: "In Progress" },
  { value: "approved",    label: "Approved"    },
  { value: "rejected",    label: "Rejected"    },
  { value: "completed",   label: "Completed"   },
];

export const REQUEST_CATEGORY_OPTIONS: { value: RequestCategory | "all"; label: string }[] = [
  { value: "all",         label: "All"         },
  { value: "hygiene",     label: "Hygiene"     },
  { value: "snacks",      label: "Snacks"      },
  { value: "drinks",      label: "Drinks"      },
  { value: "electronics", label: "Electronics" },
  { value: "games",       label: "Games"       },
  { value: "books",       label: "Books"       },
  { value: "clothing",    label: "Clothing"    },
  { value: "other",       label: "Other"       },
];

export const REQUEST_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export const REQUEST_STATUS_STYLES: Record<RequestStatus, { bg: string; text: string }> = {
  pending:     { bg: "#FEF3C7", text: "#92400E" },
  in_progress: { bg: "#EEEDFE", text: "#534AB7" },
  approved:    { bg: "#E1F5EE", text: "#0F6E56" },
  rejected:    { bg: "#FCEBEB", text: "#A32D2D" },
  completed:   { bg: "#E6F1FB", text: "#185FA5" },
};