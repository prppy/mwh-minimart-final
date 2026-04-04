import { useState, useMemo } from "react";
import { TouchableOpacity, TextInput, FlatList } from "react-native";
import { Star, ChevronDown, Search, X, ChevronLeft, ChevronRight } from "lucide-react-native";

import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// ── Types ──────────────────────────────────────────────────────────────────

type FeedbackCategory =
  | "general"
  | "product"
  | "service"
  | "facility"
  | "suggestion"
  | "complaint";

interface FeedbackItem {
  feedbackId: number;
  userId: number;
  residentName: string;
  initials: string;
  rating: number; // SmallInt 1–5, matches MWH_Rating_Feedback.Rating
  feedback: string | null;
  feedbackCategory: FeedbackCategory | null; // matches feedback_category enum
  submittedAt: string;
}

// ── Dummy Data ─────────────────────────────────────────────────────────────

const DUMMY_FEEDBACK: FeedbackItem[] = [
  { feedbackId: 1,  userId: 101, residentName: "Ahmad Rizal",   initials: "AR", rating: 5, feedback: "The points system is really motivating. I look forward to completing tasks every day.", feedbackCategory: "general",    submittedAt: "2025-01-15" },
  { feedbackId: 2,  userId: 102, residentName: "Benny Tan",     initials: "BT", rating: 2, feedback: "The canteen ran out of Milo again this week. It keeps happening and nobody fixes it.", feedbackCategory: "complaint",   submittedAt: "2025-01-14" },
  { feedbackId: 3,  userId: 103, residentName: "Calvin Ong",    initials: "CO", rating: 4, feedback: "New hygiene products are good. More variety in snacks would be appreciated.", feedbackCategory: "product",     submittedAt: "2025-01-14" },
  { feedbackId: 4,  userId: 104, residentName: "Derek Lim",     initials: "DL", rating: 3, feedback: "Officers are mostly helpful but response times during evening hours can be slow.", feedbackCategory: "service",     submittedAt: "2025-01-13" },
  { feedbackId: 5,  userId: 105, residentName: "Eddie Ng",      initials: "EN", rating: 5, feedback: "Can we have a weekly movie screening as a group reward for top batch performers?", feedbackCategory: "suggestion",  submittedAt: "2025-01-13" },
  { feedbackId: 6,  userId: 106, residentName: "Farid Hassan",  initials: "FH", rating: 1, feedback: "Task verification takes too long. Waited 3 days for points to be credited.", feedbackCategory: "complaint",   submittedAt: "2025-01-12" },
  { feedbackId: 7,  userId: 107, residentName: "Gary Woo",      initials: "GW", rating: 4, feedback: "Common areas are clean and well maintained. New outdoor space is a welcome addition.", feedbackCategory: "facility",    submittedAt: "2025-01-12" },
  { feedbackId: 8,  userId: 108, residentName: "Henry Koh",     initials: "HK", rating: 5, feedback: "Redemption process was smooth and fast. Got my items the same day.", feedbackCategory: "product",     submittedAt: "2025-01-11" },
  { feedbackId: 9,  userId: 109, residentName: "Ivan Seah",     initials: "IS", rating: 2, feedback: "Got conflicting info from two officers about task eligibility. Needs consistency.", feedbackCategory: "service",     submittedAt: "2025-01-11" },
  { feedbackId: 10, userId: 110, residentName: "Jason Lau",     initials: "JL", rating: 4, feedback: "Overall program is solid. The leaderboard creates healthy competition in our batch.", feedbackCategory: "general",    submittedAt: "2025-01-10" },
  { feedbackId: 11, userId: 111, residentName: "Kevin Yap",     initials: "KY", rating: 1, feedback: "Woke up to find my points deducted with no explanation. Very frustrating.", feedbackCategory: "complaint",   submittedAt: "2025-01-09" },
  { feedbackId: 12, userId: 112, residentName: "Leon Chua",     initials: "LC", rating: 5, feedback: "Staff have been very encouraging. Feels like they actually care about our progress.", feedbackCategory: "service",     submittedAt: "2025-01-09" },
  { feedbackId: 13, userId: 113, residentName: "Marcus Goh",    initials: "MG", rating: 3, feedback: "Facility is decent but the gym equipment could use some maintenance.", feedbackCategory: "facility",    submittedAt: "2025-01-08" },
  { feedbackId: 14, userId: 114, residentName: "Nathan Foo",    initials: "NF", rating: 4, feedback: "Would love more book options in the library. Current selection is a bit limited.", feedbackCategory: "suggestion",  submittedAt: "2025-01-08" },
  { feedbackId: 15, userId: 115, residentName: "Oscar Teo",     initials: "OT", rating: 2, feedback: "Product request I submitted 2 weeks ago still shows as pending with no updates.", feedbackCategory: "product",     submittedAt: "2025-01-07" },
];

// ── Config ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

// Matches feedback_category enum in schema
const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory | "all"; label: string }> = [
  { value: "all",        label: "All" },
  { value: "general",    label: "General" },
  { value: "product",    label: "Product" },
  { value: "service",    label: "Service" },
  { value: "facility",   label: "Facility" },
  { value: "suggestion", label: "Suggestion" },
  { value: "complaint",  label: "Complaint" },
];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "newest",       label: "Newest first" },
  { value: "oldest",       label: "Oldest first" },
  { value: "rating_desc",  label: "Highest rated" },
  { value: "rating_asc",   label: "Lowest rated" },
];

const CATEGORY_STYLES: Record<FeedbackCategory, { bg: string; text: string }> = {
  general:    { bg: "#E6F1FB", text: "#185FA5" },
  product:    { bg: "#EAF3DE", text: "#3B6D11" },
  service:    { bg: "#EEEDFE", text: "#534AB7" },
  facility:   { bg: "#E1F5EE", text: "#0F6E56" },
  suggestion: { bg: "#FAEEDA", text: "#854F0B" },
  complaint:  { bg: "#FCEBEB", text: "#A32D2D" },
};

const AVATAR_PALETTE = [
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAECE7", text: "#993C1D" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#FBEAF0", text: "#993556" },
];

// ── StarRow ────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <HStack className="gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          as={Star}
          size="2xs"
          style={{ color: i < rating ? "#BA7517" : "#D3D1C7" }}
        />
      ))}
    </HStack>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <VStack
      className="flex-1 bg-white rounded-2xl p-3 gap-1"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      <Text className="text-xs text-typography-400">{label}</Text>
      <Text className="text-xl font-bold" style={{ color: accent ?? "#2C2C2A" }}>
        {value}
      </Text>
    </VStack>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
  danger,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: active ? (danger ? "#A32D2D" : "#3C3489") : "#F1EFE8",
        borderWidth: 0.5,
        borderColor: active ? (danger ? "#A32D2D" : "#3C3489") : "#D3D1C7",
      }}
    >
      <Text
        className="text-xs font-medium"
        style={{ color: active ? "#FFFFFF" : "#5F5E5A" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── FeedbackCard ───────────────────────────────────────────────────────────

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const avatarColor = AVATAR_PALETTE[item.userId % AVATAR_PALETTE.length];
  const catStyle    = item.feedbackCategory ? CATEGORY_STYLES[item.feedbackCategory] : null;

  return (
    <VStack
      className="bg-white rounded-2xl overflow-hidden mb-3"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      <VStack className="p-4 gap-3">
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack className="gap-3 items-center" style={{ flex: 1 }}>
            <VStack
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor.bg, flexShrink: 0 }}
            >
              <Text className="text-xs font-bold" style={{ color: avatarColor.text }}>
                {item.initials}
              </Text>
            </VStack>
            <VStack className="gap-0.5" style={{ flex: 1 }}>
              <Text className="text-sm font-semibold text-typography-800">
                {item.residentName}
              </Text>
              <HStack className="items-center gap-2">
                <StarRow rating={item.rating} />
                <Text className="text-xs text-typography-400">{item.submittedAt}</Text>
              </HStack>
            </VStack>
          </HStack>

          {catStyle && item.feedbackCategory && (
            <VStack
              className="px-2 py-1 rounded-lg"
              style={{ backgroundColor: catStyle.bg, flexShrink: 0 }}
            >
              <Text className="text-xs font-medium" style={{ color: catStyle.text }}>
                {item.feedbackCategory}
              </Text>
            </VStack>
          )}
        </HStack>

        {/* Body */}
        {item.feedback ? (
          <Text className="text-sm text-typography-500 leading-relaxed">{item.feedback}</Text>
        ) : (
          <Text className="text-sm text-typography-300 italic">No written feedback provided.</Text>
        )}

        {/* Footer */}
        <HStack
          className="items-center"
          style={{ borderTopWidth: 0.5, borderTopColor: "#F1EFE8", paddingTop: 10 }}
        >
          <Text className="text-xs text-typography-400">
            Rating {item.rating}/5
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end   = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <HStack className="items-center justify-center gap-1 py-4">
      <TouchableOpacity
        onPress={onPrev}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: "#F1EFE8", opacity: page === 1 ? 0.4 : 1 }}
      >
        <Icon as={ChevronLeft} size="xs" className="text-typography-600" />
      </TouchableOpacity>

      {start > 1 && (
        <>
          <TouchableOpacity
            onPress={() => onPage(1)}
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: "#F1EFE8" }}
          >
            <Text className="text-xs text-typography-600">1</Text>
          </TouchableOpacity>
          {start > 2 && <Text className="text-xs text-typography-400 px-1">…</Text>}
        </>
      )}

      {pages.map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onPage(p)}
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: p === page ? "#3C3489" : "#F1EFE8" }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: p === page ? "#FFFFFF" : "#5F5E5A" }}
          >
            {p}
          </Text>
        </TouchableOpacity>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <Text className="text-xs text-typography-400 px-1">…</Text>}
          <TouchableOpacity
            onPress={() => onPage(totalPages)}
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: "#F1EFE8" }}
          >
            <Text className="text-xs text-typography-600">{totalPages}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: "#F1EFE8", opacity: page === totalPages ? 0.4 : 1 }}
      >
        <Icon as={ChevronRight} size="xs" className="text-typography-600" />
      </TouchableOpacity>
    </HStack>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const FeedbackPage: React.FC = () => {
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState<FeedbackCategory | "all">("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy]             = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage]                 = useState(1);

  const stats = useMemo(() => {
    const total      = DUMMY_FEEDBACK.length;
    const avg        = total > 0 ? (DUMMY_FEEDBACK.reduce((s, x) => s + x.rating, 0) / total).toFixed(1) : "—";
    const complaints = DUMMY_FEEDBACK.filter((d) => d.feedbackCategory === "complaint").length;
    return { total, avg, complaints };
  }, []);

  const filtered = useMemo(() => {
    let result = DUMMY_FEEDBACK.filter((d) => {
      if (category !== "all" && d.feedbackCategory !== category) return false;
      if (ratingFilter !== 0 && d.rating !== ratingFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.residentName.toLowerCase().includes(q) && !(d.feedback ?? "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });

    if (sortBy === "oldest")           result = [...result].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    else if (sortBy === "rating_desc") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "rating_asc")  result = [...result].sort((a, b) => a.rating - b.rating);
    else                               result = [...result].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return result;
  }, [category, ratingFilter, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Always reset to page 1 when filters change
  function applyFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const activeFilterCount = [category !== "all", ratingFilter !== 0].filter(Boolean).length;

  function clearFilters() {
    setCategory("all");
    setRatingFilter(0);
    setSearch("");
    setPage(1);
  }

  return (
    <FlatList
      data={paginated}
      keyExtractor={(item) => String(item.feedbackId)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      ListHeaderComponent={
        <VStack className="gap-4 pb-3">
          <Heading className="text-typography-800" size="xl">Resident Feedback</Heading>

          {/* Stats */}
          <HStack className="gap-2">
            <StatCard label="Total"      value={stats.total} />
            <StatCard label="Avg rating" value={stats.avg} />
            <StatCard label="Complaints" value={stats.complaints} accent="#A32D2D" />
          </HStack>

          {/* Search + Sort */}
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
            <VStack className="bg-white rounded-xl overflow-hidden" style={{ borderWidth: 0.5, borderColor: "#D3D1C7" }}>
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
                    style={{ color: sortBy === opt.value ? "#3C3489" : "#5F5E5A", fontWeight: sortBy === opt.value ? "600" : "400" }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </VStack>
          )}

          {/* Category — matches feedback_category enum */}
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

          {/* Rating — matches SmallInt 1–5 */}
          <VStack className="gap-2">
            <Text className="text-xs font-medium text-typography-400" style={{ letterSpacing: 0.6 }}>
              RATING
            </Text>
            <HStack className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <FilterChip
                  key={r}
                  label={r === 0 ? "Any" : `${"★".repeat(r)}`}
                  active={ratingFilter === r}
                  onPress={() => applyFilter(() => setRatingFilter(r))}
                  danger={r === 1}
                />
              ))}
            </HStack>
          </VStack>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <HStack className="items-center">
              <TouchableOpacity onPress={clearFilters}>
                <Text className="text-xs font-medium" style={{ color: "#534AB7" }}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </HStack>
          )}

          {/* Result count + page info */}
          <Text className="text-xs text-typography-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 ? `  ·  ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active` : ""}
            {"  ·  "}Page {page} of {totalPages}
          </Text>
        </VStack>
      }
      renderItem={({ item }) => (
        <FeedbackCard item={item} />
      )}
      ListEmptyComponent={
        <VStack className="items-center py-12 gap-2">
          <Text className="text-sm text-typography-400">No feedback matches your filters.</Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-sm font-medium" style={{ color: "#534AB7" }}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </VStack>
      }
      ListFooterComponent={
        filtered.length > 0 ? (
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