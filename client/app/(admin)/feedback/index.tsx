import { useState, useEffect, useCallback } from "react";
import { TouchableOpacity, TextInput, FlatList, ActivityIndicator, ScrollView } from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";

import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { FeedbackCard } from "@/components/feedback/feedbackCard";
import { ProductRequestCard } from "@/components/feedback/productRequestCard";
import { FilterChip } from "@/components/feedback/filterChip";
import { Pagination } from "@/components/feedback/pagination";
import { StatCard } from "@/components/feedback/statCard";
import { ExportExcel } from "@/components/feedback/exportExcel";

import {
  type FeedbackCategory,
  type FeedbackStatus,
  type FeedbackItem,
  PAGE_SIZE,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "@/utils/types/feedback";

import {
  type RequestStatus,
  type RequestCategory,
  type ProductRequestItem,
  REQUEST_STATUS_OPTIONS,
  REQUEST_CATEGORY_OPTIONS,
  REQUEST_SORT_OPTIONS,
} from "@/utils/types/productRequest";

import { fetchFeedback, fetchFeedbackStats } from "@/utils/api/feedback";
import { fetchProductRequests } from "@/utils/api/productRequests";

const PAGE_SIZE_PR = 5;

// ── Scrollable chip row ────────────────────────────────────────────────────
function ChipRow({
  label,
  options,
  value,
  onChange,
  danger,
}: {
  label:    string;
  options:  { value: string | number; label: string }[];
  value:    string | number;
  onChange: (v: any) => void;
  danger?:  (v: any) => boolean;
}) {
  return (
    <VStack className="gap-1">
      <Text className="text-xs font-medium text-typography-400" style={{ letterSpacing: 0.6 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-2">
          {options.map((opt) => (
            <FilterChip
              key={String(opt.value)}
              label={opt.label}
              active={value === opt.value}
              onPress={() => onChange(opt.value)}
              danger={danger ? danger(opt.value) : false}
            />
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
const FeedbackPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"feedback" | "requests">("feedback");

  // ── Feedback filters ───────────────────────────────────────────────────
  const [fbSearch,   setFbSearch]   = useState("");
  const [fbCategory, setFbCategory] = useState<FeedbackCategory | "all">("all");
  const [fbRating,   setFbRating]   = useState(0);
  const [fbStatus,   setFbStatus]   = useState<FeedbackStatus | "all">("new");
  const [fbSortBy,   setFbSortBy]   = useState("newest");
  const [fbPage,     setFbPage]     = useState(1);

  // ── Feedback server state ──────────────────────────────────────────────
  const [fbItems,      setFbItems]      = useState<FeedbackItem[]>([]);
  const [fbTotal,      setFbTotal]      = useState(0);
  const [fbTotalPages, setFbTotalPages] = useState(1);
  const [fbLoading,    setFbLoading]    = useState(true);
  const [fbError,      setFbError]      = useState<string | null>(null);
  const [stats,        setStats]        = useState({ total: 0, avg: "—", complaints: 0 });

  // ── Product request filters ────────────────────────────────────────────
  const [prSearch,   setPrSearch]   = useState("");
  const [prCategory, setPrCategory] = useState<RequestCategory | "all">("all");
  const [prStatus,   setPrStatus]   = useState<RequestStatus | "all">("all");
  const [prSortBy,   setPrSortBy]   = useState("newest");
  const [prPage,     setPrPage]     = useState(1);

  // ── Product request server state ───────────────────────────────────────
  const [prItems,      setPrItems]      = useState<ProductRequestItem[]>([]);
  const [prTotal,      setPrTotal]      = useState(0);
  const [prTotalPages, setPrTotalPages] = useState(1);
  const [prLoading,    setPrLoading]    = useState(true);
  const [prError,      setPrError]      = useState<string | null>(null);

  // ── Load stats once ────────────────────────────────────────────────────
  useEffect(() => {
    fetchFeedbackStats().then(setStats).catch(console.error);
  }, []);

  // ── Load feedback ──────────────────────────────────────────────────────
  const loadFeedback = useCallback(async () => {
    setFbLoading(true);
    setFbError(null);
    try {
      const res = await fetchFeedback({
        search:   fbSearch,
        category: fbCategory,
        rating:   fbRating,
        status:   fbStatus,
        sortBy:   fbSortBy,
        page:     fbPage,
        pageSize: PAGE_SIZE,
      });
      setFbItems(res.data);
      setFbTotal(res.total);
      setFbTotalPages(res.totalPages);
    } catch {
      setFbError("Failed to load feedback.");
    } finally {
      setFbLoading(false);
    }
  }, [fbSearch, fbCategory, fbRating, fbStatus, fbSortBy, fbPage]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  // ── Load product requests ──────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    setPrLoading(true);
    setPrError(null);
    try {
      const res = await fetchProductRequests({
        search:   prSearch,
        category: prCategory,
        status:   prStatus,
        sortBy:   prSortBy,
        page:     prPage,
        pageSize: PAGE_SIZE_PR,
      });
      setPrItems(res.data);
      setPrTotal(res.total);
      setPrTotalPages(res.totalPages);
    } catch {
      setPrError("Failed to load product requests.");
    } finally {
      setPrLoading(false);
    }
  }, [prSearch, prCategory, prStatus, prSortBy, prPage]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // ── Helpers ────────────────────────────────────────────────────────────
  function applyFbFilter(fn: () => void) { fn(); setFbPage(1); }
  function applyPrFilter(fn: () => void) { fn(); setPrPage(1); }

  function clearFbFilters() {
    setFbCategory("all"); setFbRating(0);
    setFbStatus("new");   setFbSearch("");
    setFbPage(1);
  }

  function clearPrFilters() {
    setPrCategory("all"); setPrStatus("all");
    setPrSearch("");      setPrPage(1);
  }

  const fbActiveFilterCount = [fbCategory !== "all", fbRating !== 0, fbStatus !== "new"].filter(Boolean).length;
  const prActiveFilterCount = [prCategory !== "all", prStatus !== "all"].filter(Boolean).length;

  const isFeedback = activeTab === "feedback";

  const loading    = isFeedback ? fbLoading    : prLoading;
  const total      = isFeedback ? fbTotal      : prTotal;
  const page       = isFeedback ? fbPage       : prPage;
  const totalPages = isFeedback ? fbTotalPages : prTotalPages;
  const setPage    = isFeedback ? setFbPage    : setPrPage;
  const listData: any[] = isFeedback ? fbItems : prItems;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) => String(
        isFeedback
          ? (item as FeedbackItem).feedbackId
          : (item as ProductRequestItem).requestId
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}

      ListHeaderComponent={
        <VStack className="gap-3 pb-3">

          {/* Heading + Export */}
          <HStack className="items-center justify-between">
            <Heading className="text-typography-800" size="xl">Resident Feedback</Heading>
            <ExportExcel />
          </HStack>

          {/* Stats */}
          <HStack className="gap-2">
            <StatCard label="Total"      value={stats.total} />
            <StatCard label="Avg mood"   value={stats.avg} />
            <StatCard label="Complaints" value={stats.complaints} accent="#A32D2D" />
          </HStack>

          {/* Tab toggle */}
          <HStack
            className="bg-white rounded-xl p-1"
            style={{ borderWidth: 0.5, borderColor: "#D3D1C7" }}
          >
            {(["feedback", "requests"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 items-center py-2 rounded-lg"
                style={{ backgroundColor: activeTab === tab ? "#3C3489" : "transparent" }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: activeTab === tab ? "#fff" : "#5F5E5A" }}
                >
                  {tab === "feedback" ? "Feedback" : "Product Requests"}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>

          {/* Search */}
          <HStack
            className="items-center gap-2 bg-white rounded-xl px-3"
            style={{ borderWidth: 0.5, borderColor: "#D3D1C7", height: 40 }}
          >
            <Icon as={Search} size="xs" className="text-typography-400" />
            <TextInput
              value={isFeedback ? fbSearch : prSearch}
              onChangeText={(v) => isFeedback
                ? applyFbFilter(() => setFbSearch(v))
                : applyPrFilter(() => setPrSearch(v))
              }
              placeholder={isFeedback
                ? "Search resident or feedback..."
                : "Search resident or product..."
              }
              placeholderTextColor="#B4B2A9"
              style={{ flex: 1, fontSize: 13, color: "#2C2C2A", height: 40 }}
            />
            {(isFeedback ? fbSearch : prSearch).length > 0 && (
              <TouchableOpacity onPress={() => isFeedback
                ? applyFbFilter(() => setFbSearch(""))
                : applyPrFilter(() => setPrSearch(""))
              }>
                <Icon as={X} size="xs" className="text-typography-400" />
              </TouchableOpacity>
            )}
          </HStack>

          {/* ── Feedback filters ── */}
          {isFeedback && (
            <VStack className="gap-2">
              <ChipRow
                label="SORT"
                options={SORT_OPTIONS}
                value={fbSortBy}
                onChange={(v) => { setFbSortBy(v); setFbPage(1); }}
              />
              <ChipRow
                label="STATUS"
                options={STATUS_OPTIONS}
                value={fbStatus}
                onChange={(v) => applyFbFilter(() => setFbStatus(v))}
              />
              <ChipRow
                label="CATEGORY"
                options={CATEGORY_OPTIONS}
                value={fbCategory}
                onChange={(v) => applyFbFilter(() => setFbCategory(v))}
                danger={(v) => v === "complaint"}
              />
              <ChipRow
                label="SENTIMENT"
                options={[
                  { value: 0, label: "Any"   },
                  { value: 1, label: "Poor"  },
                  { value: 2, label: "Okay"  },
                  { value: 3, label: "Happy" },
                ]}
                value={fbRating}
                onChange={(v) => applyFbFilter(() => setFbRating(v))}
                danger={(v) => v === 1}
              />
              {fbActiveFilterCount > 0 && (
                <TouchableOpacity onPress={clearFbFilters}>
                  <Text className="text-xs font-medium" style={{ color: "#534AB7" }}>Clear all</Text>
                </TouchableOpacity>
              )}
            </VStack>
          )}

          {/* ── Product request filters ── */}
          {!isFeedback && (
            <VStack className="gap-2">
              <ChipRow
                label="SORT"
                options={REQUEST_SORT_OPTIONS}
                value={prSortBy}
                onChange={(v) => { setPrSortBy(v); setPrPage(1); }}
              />
              <ChipRow
                label="STATUS"
                options={REQUEST_STATUS_OPTIONS}
                value={prStatus}
                onChange={(v) => applyPrFilter(() => setPrStatus(v))}
              />
              {/* this one like not implemented LOL */}
              {/* <ChipRow
                label="CATEGORY"
                options={REQUEST_CATEGORY_OPTIONS}
                value={prCategory}
                onChange={(v) => applyPrFilter(() => setPrCategory(v))}
              /> */}
              {prActiveFilterCount > 0 && (
                <TouchableOpacity onPress={clearPrFilters}>
                  <Text className="text-xs font-medium" style={{ color: "#534AB7" }}>Clear all</Text>
                </TouchableOpacity>
              )}
            </VStack>
          )}

          {/* Result count */}
          <Text className="text-xs text-typography-400">
            {loading
              ? "Loading..."
              : `${total} result${total !== 1 ? "s" : ""}  ·  Page ${page} of ${totalPages}`
            }
          </Text>
        </VStack>
      }

      renderItem={({ item }) => isFeedback
        ? <FeedbackCard
            item={item as FeedbackItem}
            onStatusChange={() => loadFeedback()}
          />
        : <ProductRequestCard
            item={item as ProductRequestItem}
            onStatusChange={() => loadRequests()}
          />
      }

      ListEmptyComponent={() => (
        <VStack className="items-center py-12 gap-2">
          {loading ? (
            <ActivityIndicator color="#534AB7" />
          ) : (isFeedback ? fbError : prError) ? (
            <>
              <Text className="text-sm text-typography-600">
                {isFeedback ? fbError : prError}
              </Text>
              <TouchableOpacity onPress={isFeedback ? loadFeedback : loadRequests}>
                <Text className="text-sm font-medium" style={{ color: "#534AB7" }}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-sm text-typography-400">
              {isFeedback
                ? fbStatus === "new"
                  ? "No unreviewed feedback. All caught up!"
                  : "No feedback matches your filters."
                : "No product requests match your filters."
              }
            </Text>
          )}
        </VStack>
      )}

      ListFooterComponent={() =>
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