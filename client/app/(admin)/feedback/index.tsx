import { useState, useEffect, useCallback } from "react";
import { TouchableOpacity, TextInput, FlatList, ActivityIndicator } from "react-native";
import { ChevronDown, Search, X, Download } from "lucide-react-native";

import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { FeedbackCard } from "@/components/feedback/feedbackCard";
import { FilterChip } from "@/components/feedback/filterChip";
import { Pagination } from "@/components/feedback/pagination";
import { StatCard } from "@/components/feedback/statCard";
import { ExportExcel } from "@/components/feedback/exportExcel";

import {
  type FeedbackCategory,
  type FeedbackItem,
  PAGE_SIZE,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
} from "@/utils/types/feedback";
import { fetchFeedback, fetchFeedbackStats } from "@/utils/api/feedback";

const FeedbackPage: React.FC = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState<FeedbackCategory | "all">("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy,       setSortBy]       = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page,         setPage]         = useState(1);

  // ── Server state ──────────────────────────────────────────────────────────
  const [items,      setItems]      = useState<FeedbackItem[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats,      setStats]      = useState({ total: 0, avg: "—", complaints: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // ── Stats: fetched once ───────────────────────────────────────────────────
  useEffect(() => {
    fetchFeedbackStats().then(setStats).catch(console.error);
  }, []);

  // ── List: re-fetched on any filter/sort/page change ───────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFeedback({
        search,
        category,
        rating:   ratingFilter,
        sortBy,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setError("Failed to load feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, category, ratingFilter, sortBy, page]);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function applyFilter(fn: () => void) { fn(); setPage(1); }

  function clearFilters() {
    setCategory("all");
    setRatingFilter(0);
    setSearch("");
    setPage(1);
  }

  const activeFilterCount = [category !== "all", ratingFilter !== 0].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.feedbackId)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}

      ListHeaderComponent={
        <VStack className="gap-4 pb-3">

          {/* Heading + Export button */}
          <HStack className="items-center justify-between">
            <Heading className="text-typography-800" size="xl">Resident Feedback</Heading>
            <ExportExcel />
          </HStack>

          {/* Stats row */}
          <HStack className="gap-2">
            <StatCard label="Total"      value={stats.total} />
            <StatCard label="Avg rating" value={stats.avg} />
            <StatCard label="Complaints" value={stats.complaints} accent="#A32D2D" />
          </HStack>

          {/* Search + Sort trigger */}
          <HStack className="gap-2 items-center">
            <HStack
              className="flex-1 items-center gap-2 bg-white rounded-xl px-3"
              style={{ borderWidth: 0.5, borderColor: "#D3D1C7", height: 40 }}
            >
              <Icon as={Search} size="xs" className="text-typography-400" />
              <TextInput
                value={search}
                onChangeText={(v) => applyFilter(() => setSearch(v))}
                placeholder="Search resident or feedback..."
                placeholderTextColor="#B4B2A9"
                style={{ flex: 1, fontSize: 13, color: "#2C2C2A", height: 40 }}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => applyFilter(() => setSearch(""))}>
                  <Icon as={X} size="xs" className="text-typography-400" />
                </TouchableOpacity>
              )}
            </HStack>

            <TouchableOpacity
              onPress={() => setShowSortMenu((v) => !v)}
              className="flex-row items-center gap-1 px-3 rounded-xl bg-white"
              style={{ borderWidth: 0.5, borderColor: "#D3D1C7", height: 40 }}
            >
              <Text className="text-xs text-typography-600">
                {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              </Text>
              <Icon as={ChevronDown} size="xs" className="text-typography-400" />
            </TouchableOpacity>
          </HStack>

          {/* Sort dropdown */}
          {showSortMenu && (
            <VStack
              className="bg-white rounded-xl overflow-hidden"
              style={{ borderWidth: 0.5, borderColor: "#D3D1C7" }}
            >
              {SORT_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setSortBy(opt.value); setShowSortMenu(false); setPage(1); }}
                  className="px-4 py-3"
                  style={{
                    backgroundColor: sortBy === opt.value ? "#F1EFE8" : "transparent",
                    borderTopWidth: i > 0 ? 0.5 : 0,
                    borderTopColor: "#F1EFE8",
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color:      sortBy === opt.value ? "#3C3489" : "#5F5E5A",
                      fontWeight: sortBy === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </VStack>
          )}

          {/* Category filter */}
          <VStack className="gap-2">
            <Text className="text-xs font-medium text-typography-400" style={{ letterSpacing: 0.6 }}>
              CATEGORY
            </Text>
            <HStack className="flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={category === opt.value}
                  onPress={() => applyFilter(() => setCategory(opt.value as FeedbackCategory | "all"))}
                  danger={opt.value === "complaint"}
                />
              ))}
            </HStack>
          </VStack>

          {/* Rating filter */}
          <VStack className="gap-2">
            <Text className="text-xs font-medium text-typography-400" style={{ letterSpacing: 0.6 }}>
              RATING
            </Text>
            <HStack className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <FilterChip
                  key={r}
                  label={r === 0 ? "Any" : "★".repeat(r)}
                  active={ratingFilter === r}
                  onPress={() => applyFilter(() => setRatingFilter(r))}
                  danger={r === 1}
                />
              ))}
            </HStack>
          </VStack>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-xs font-medium" style={{ color: "#534AB7" }}>Clear all</Text>
            </TouchableOpacity>
          )}

          {/* Result count */}
          <Text className="text-xs text-typography-400">
            {loading
              ? "Loading..."
              : `${total} result${total !== 1 ? "s" : ""}${activeFilterCount > 0 ? `  ·  ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active` : ""}  ·  Page ${page} of ${totalPages}`
            }
          </Text>
        </VStack>
      }

      renderItem={({ item }) => <FeedbackCard item={item} />}

      ListEmptyComponent={() => (
        <VStack className="items-center py-12 gap-2">
          {loading ? (
            <ActivityIndicator color="#534AB7" />
          ) : error ? (
            <>
              <Text className="text-sm text-typography-600">{error}</Text>
              <TouchableOpacity onPress={load}>
                <Text className="text-sm font-medium" style={{ color: "#534AB7" }}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-sm text-typography-400">
                {activeFilterCount > 0 ? "No feedback matches your filters." : "No feedback yet."}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text className="text-sm font-medium" style={{ color: "#534AB7" }}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </VStack>
      )}

      ListFooterComponent={
        !loading && total > 0 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onPage={setPage}
          />
        ) : null
      }
    />
  );
};

export default FeedbackPage;