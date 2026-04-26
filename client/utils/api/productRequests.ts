import api from "../api";
import type {
  ProductRequestFilters,
  ProductRequestListResponse,
} from "@/utils/types/productRequest";

export async function fetchProductRequests(
  filters: ProductRequestFilters
): Promise<ProductRequestListResponse> {
  const res = await api.get<ProductRequestListResponse>("/feedback/product-requests", {
    params: {
      search:   filters.search   ?? "",
      category: filters.category ?? "all",
      status:   filters.status   ?? "all",
      sortBy:   filters.sortBy   ?? "newest",
      page:     filters.page     ?? 1,
      pageSize: filters.pageSize ?? 5,
    },
  });
  return res.data;
}

export async function updateRequestStatus(requestId: number, status: string) {
  const res = await api.patch(`/feedback/product-requests/${requestId}/status`, { status });
  return res.data;
}