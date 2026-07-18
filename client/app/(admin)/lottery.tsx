import { useEffect, useMemo, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import * as lucide from "lucide-react-native";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react-native";

const MOBILE_BREAKPOINT = 768;

import api from "@/utils/api";
import { Product, Resident, WheelParticipant } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import FortuneWheel from "@/components/custom-fortune-wheel";
import CustomSpinner from "@/components/custom-spinner";
import PrizeSelector from "@/components/lottery/prize-selector";
import ResidentCard from "@/components/lottery/resident-card";
import WinnerDialog from "@/components/lottery/winner-dialog";

import { Button, ButtonText } from "@/components/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import * as alert from "@/components/ui/alert-dialog";

// types

type SortOrder = "none" | "asc" | "desc";

interface FilterState {
  minPoints: number | "";
  sortOrder: SortOrder;
}

const DEFAULT_FILTERS: FilterState = {
  minPoints: "",
  sortOrder: "none",
};

// FILTER MODAL

interface SortOptionButtonProps {
  order: "asc" | "desc";
  activeOrder: SortOrder;
  onToggle: (order: SortOrder) => void;
}

const SortOptionButton: React.FC<SortOptionButtonProps> = ({
  order,
  activeOrder,
  onToggle,
}) => {
  const isActive = activeOrder === order;
  const Icon = order === "asc" ? ArrowDownAZ : ArrowUpZA;
  const label = order === "asc" ? "A → Z" : "Z → A";

  return (
    <Pressable
      onPress={() => onToggle(order)}
      className={`flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 ${
        isActive
          ? "bg-indigoscale-50 border-indigoscale-500"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <Icon
        size={18}
        className={isActive ? "text-indigoscale-600" : "text-gray-400"}
      />
      <Text
        className={isActive ? "text-indigoscale-700" : "text-gray-500"}
        bold={isActive}
      >
        {label}
      </Text>
    </Pressable>
  );
};

interface MinPointsInputProps {
  value: FilterState["minPoints"];
  onChange: (value: string) => void;
  onClear: () => void;
}

const MinPointsInput: React.FC<MinPointsInputProps> = ({
  value,
  onChange,
  onClear,
}) => (
  <VStack space="xs">
    <Text className="text-gray-500" bold>
      Minimum Points
    </Text>
    <HStack space="sm" className="items-center">
      <Input className="flex-1" size="md">
        <InputField
          keyboardType="numeric"
          placeholder="e.g. 80"
          value={value === "" ? "" : String(value)}
          onChangeText={onChange}
        />
      </Input>
      {value !== "" && (
        <Pressable onPress={onClear} className="p-2 rounded-lg bg-gray-100">
          <RotateCcw size={16} className="text-gray-500" />
        </Pressable>
      )}
    </HStack>
    <Text className="text-xs text-gray-400">
      Only show residents with this many points or more
    </Text>
  </VStack>
);

// main modal component

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
}) => {
  const [draft, setDraft] = useState<FilterState>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen]);

  const handleMinPointsChange = (value: string) => {
    if (value === "") return setDraft((d) => ({ ...d, minPoints: "" }));
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0)
      setDraft((d) => ({ ...d, minPoints: parsed }));
  };

  const handleSortToggle = (order: SortOrder) =>
    setDraft((d) => ({
      ...d,
      sortOrder: d.sortOrder === order ? "none" : order,
    }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const isDirty =
    draft.minPoints !== DEFAULT_FILTERS.minPoints ||
    draft.sortOrder !== DEFAULT_FILTERS.sortOrder;

  return (
    <alert.AlertDialog isOpen={isOpen} onClose={onClose}>
      <alert.AlertDialogBackdrop />
      <alert.AlertDialogContent className="rounded-2xl p-0 overflow-hidden max-w-sm w-full">
        {/* Header */}
        <alert.AlertDialogHeader className="px-5 pt-5 pb-4 flex-row items-center justify-between">
          <Heading size="lg" className="text-indigoscale-700">
            Filter &amp; Sort
          </Heading>
          <Pressable onPress={onClose} className="p-1">
            <X size={20} className="text-gray-400" />
          </Pressable>
        </alert.AlertDialogHeader>

        {/* Body */}
        <alert.AlertDialogBody className="px-5 gap-5">
          <MinPointsInput
            value={draft.minPoints}
            onChange={handleMinPointsChange}
            onClear={() => setDraft((d) => ({ ...d, minPoints: "" }))}
          />

          <VStack space="sm" className="mt-4">
            <Text className="text-gray-500" bold>
              Sort by Name
            </Text>
            <HStack space="sm">
              <SortOptionButton
                order="asc"
                activeOrder={draft.sortOrder}
                onToggle={handleSortToggle}
              />
              <SortOptionButton
                order="desc"
                activeOrder={draft.sortOrder}
                onToggle={handleSortToggle}
              />
            </HStack>
          </VStack>
        </alert.AlertDialogBody>

        {/* Footer */}
        <alert.AlertDialogFooter className="px-5 py-4 flex-row gap-3 mt-4">
          <Button
            variant="outline"
            action="secondary"
            className="flex-1"
            onPress={() => setDraft(DEFAULT_FILTERS)}
            disabled={!isDirty}
          >
            <ButtonText>Reset</ButtonText>
          </Button>
          <Button
            action="primary"
            className="flex-1 bg-indigoscale-700"
            onPress={handleApply}
          >
            <ButtonText>Apply</ButtonText>
          </Button>
        </alert.AlertDialogFooter>
      </alert.AlertDialogContent>
    </alert.AlertDialog>
  );
};



// Active filter pills

interface ActiveFilterPillsProps {
  filters: FilterState;
  onClearMinPoints: () => void;
  onClearSortOrder: () => void;
}

const ActiveFilterPills: React.FC<ActiveFilterPillsProps> = ({
  filters,
  onClearMinPoints,
  onClearSortOrder,
}) => {
  const hasFilters = filters.minPoints !== "" || filters.sortOrder !== "none";

  if (!hasFilters) return null;

  return (
    <HStack space="xs" className="flex-wrap">
      {filters.minPoints !== "" && (
        <HStack
          className="items-center gap-1 px-3 py-1 bg-indigoscale-100 rounded-full"
          space="xs"
        >
          <Text className="text-indigoscale-700 text-xs" bold>
            ≥ {filters.minPoints} pts
          </Text>
          <Pressable onPress={onClearMinPoints}>
            <X size={12} className="text-indigoscale-500" />
          </Pressable>
        </HStack>
      )}
      {filters.sortOrder !== "none" && (
        <HStack
          className="items-center gap-1 px-3 py-1 bg-indigoscale-100 rounded-full"
          space="xs"
        >
          {filters.sortOrder === "asc" ? (
            <ArrowDownAZ size={12} className="text-indigoscale-600" />
          ) : (
            <ArrowUpZA size={12} className="text-indigoscale-600" />
          )}
          <Text className="text-indigoscale-700 text-xs" bold>
            {filters.sortOrder === "asc" ? "A → Z" : "Z → A"}
          </Text>
          <Pressable onPress={onClearSortOrder}>
            <X size={12} className="text-indigoscale-500" />
          </Pressable>
        </HStack>
      )}
    </HStack>
  );
};

// Filter Button

interface FilterButtonProps {
  activeFilterCount: number;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  activeFilterCount,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border-2 font-semibold ${
      activeFilterCount > 0
        ? "border-indigoscale-500 bg-indigoscale-50"
        : "border-gray-200 bg-gray-50"
    }`}
  >
    <SlidersHorizontal
      size={18}
      className={
        activeFilterCount > 0 ? "text-indigoscale-600" : "text-gray-400"
      }
    />
    <Text
      className={
        activeFilterCount > 0
          ? "text-indigoscale-700 text-sm"
          : "text-gray-500 text-sm"
      }
      bold={activeFilterCount > 0}
    >
      Filter &amp; Sort
    </Text>
    {activeFilterCount > 0 && (
      <Badge
        size="sm"
        className="bg-indigoscale-500 rounded-full h-5 w-5 items-center justify-center"
      >
        <BadgeText className="text-white text-xs">
          {activeFilterCount}
        </BadgeText>
      </Badge>
    )}
  </Pressable>
);

//  Main Page

const LotteryPage: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState("");
  const [redemptionStatus, setRedemptionStatus] = useState<RedemptionStatus>("idle");
  const [redemptionError, setRedemptionError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => products.find((p) => String(p.id) === selectedItemId) ?? null,
    [products, selectedItemId]
  );

  // Only show Showcase items (Type_ID = 2), filtered by search
  const showcaseProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.typeId === 2 &&
          p.productName.toLowerCase().includes(itemSearch.toLowerCase())
      ),
    [products, itemSearch]
  );

  // When selected item changes, drop any selected residents who can't afford it
  useEffect(() => {
    if (!selectedItem) return;
    setSelectedResidents((prev) =>
      prev.filter((id) => {
        const res = residents.find((r) => String(r.id) === id);
        return res && (res.currentPoints ?? 0) >= selectedItem.points;
      })
    );
  }, [selectedItem, residents]);

  // committed filter state: updated only when user presses Apply
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // data fetching

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("products");
        const data = response.data.data;
        const fetched: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setProducts(fetched);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    const fetchResidents = async () => {
      setLoading(true);
      try {
        const usersResponse = await api.get(
          "users?role=resident&includeProfilePicture=false",
        );
        const fetchedResidents = usersResponse.data.data.users ?? [];

        const parsedResidents: Resident[] = fetchedResidents
          .filter((u: any) => u.userRole === "resident" && u.resident)
          .map((u: any) => ({
            id: u.id,
            userId: u.resident.userId,
            userName: u.userName,
            userRole: "resident",
            profilePicture: u.profilePicture ?? null,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
            batchNumber: u.resident.batchNumber,
            currentPoints: u.resident.currentPoints,
            totalPoints: u.resident.totalPoints,
            dateOfAdmission: new Date(u.resident.dateOfAdmission),
            dateOfBirth: new Date(u.resident.dateOfBirth),
            lastAbscondence: u.resident.lastAbscondence ?? null,
            backgroundType: u.resident.backgroundType,
            wallpaperType: u.resident.wallpaperType,
          }));

        setResidents(parsedResidents);
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchResidents();
  }, []);

  // derived data

  const userMap = useMemo(() => {
    const map = new Map<string, Resident>();
    residents.forEach((res) => map.set(String(res.id), res));
    return map;
  }, [residents]);

  const filteredResidents = useMemo(() => {
    let result = residents.filter((res) =>
      res.userName.toLowerCase().includes(search.toLowerCase()),
    );

    if (filters.minPoints !== "") {
      result = result.filter(
        (res) => (res.currentPoints ?? 0) >= (filters.minPoints as number),
      );
    }

    if (filters.sortOrder !== "none") {
      // User-applied name sort
      result = [...result].sort((a, b) => {
        const cmp = a.userName.localeCompare(b.userName);
        return filters.sortOrder === "asc" ? cmp : -cmp;
      });
    } else {
      // Default: highest points first
      result = [...result].sort(
        (a, b) => (b.currentPoints ?? 0) - (a.currentPoints ?? 0),
      );
    }

    return result;
  }, [residents, search, filters]);

  const wheelParticipants = useMemo<WheelParticipant[]>(() => {
    return Array.from(selectedResidents).map((userId) => {
      const user = userMap.get(userId);
      return {
        id: String(user?.id ?? ""),
        name: user?.userName || "Unknown",
        ...(user?.profilePicture
          ? { profilePicture: user.profilePicture }
          : {}),
      };
    });
  }, [selectedResidents, userMap]);

  // number of active filters: drives the badge
  const activeFilterCount = [
    filters.minPoints !== "",
    filters.sortOrder !== "none",
  ].filter(Boolean).length;

  // wheel helpers

  const generateWheelColors = (count: number): string[] => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  const wheelOptions = wheelParticipants.map((p) => p.name);
  const wheelColors = generateWheelColors(wheelParticipants.length);

  // handlers

  const handleSelectAll = () =>
    setSelectedResidents(
      filteredResidents
        .filter((res) => !selectedItem || (res.currentPoints ?? 0) >= selectedItem.points)
        .map((res) => res.id.toString())
    );

  const handleDeselectAll = () => setSelectedResidents([]);

  const handleSpin = () => {
    if (wheelParticipants.length < 1) {
      setWinner("Error: Please select at least 1 participant");
      return;
    }
    setSpinning(true);
  };

  const handleSpinEnd = (winnerName: string) => {
    setSpinning(false);
    setTimeout(async () => {
      setWinner(winnerName);
      const winnerParticipant = wheelParticipants.find(
        (p) => p.name === winnerName,
      );
      if (winnerParticipant) {
        setSelectedResidents((prev) =>
          prev.filter((id) => id !== winnerParticipant.id),
        );

        // Auto-redeem the selected item for the winner
        if (selectedItem) {
          setRedemptionStatus("loading");
          setRedemptionError(null);
          try {
            await api.post("transactions/redemption", {
              userId: parseInt(winnerParticipant.id),
              products: [{ id: selectedItem.id, quantity: 1 }],
            });
            setRedemptionStatus("success");

            // Update the winner's local points so the UI reflects the deduction
            setResidents((prev) =>
              prev.map((r) =>
                String(r.id) === winnerParticipant.id
                  ? {
                      ...r,
                      currentPoints:
                        (r.currentPoints ?? 0) - selectedItem.points,
                    }
                  : r
              )
            );
          } catch (error: any) {
            setRedemptionStatus("error");
            setRedemptionError(
              error?.response?.data?.error?.message ??
                "Redemption failed. Please process manually."
            );
          }
        }
      }
    }, 500);
  };

  const handleCloseWinner = () => {
    setWinner(null);
    setRedemptionStatus("idle");
    setRedemptionError(null);
  };

  const toggleResident = (resId: string) => {
    setSelectedResidents((prev) =>
      prev.includes(resId)
        ? prev.filter((id) => id !== resId)
        : [...prev, resId],
    );
  };

  // render

  const wheelSize = isMobile ? Math.min(280, width - 60) : 380;
  const [phase, setPhase] = useState<"setup" | "spin">("setup");
  const [setupTab, setSetupTab] = useState<"prize" | "residents">("prize");

  const readyToSpin = !!selectedItemId && selectedResidents.length > 0;

  // ===== PHASE 2: SPIN =====
  if (phase === "spin") {
    return (
      <View className="flex-1 bg-indigoscale-500" style={{ alignItems: "center", justifyContent: "center", padding: isMobile ? 12 : 24 }}>
        {/* Back button */}
        <Pressable
          onPress={() => setPhase("setup")}
          style={{
            position: "absolute",
            top: isMobile ? 12 : 24,
            left: isMobile ? 12 : 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(255,255,255,0.15)",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            zIndex: 10,
          }}
        >
          <Icon as={lucide.ArrowLeft} size="sm" style={{ color: "#FFFFFF" }} />
          <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
            Back to Setup
          </Text>
        </Pressable>

        {/* Wheel + Controls */}
        <VStack style={{ alignItems: "center", gap: 16, maxWidth: 500 }}>
          {/* Summary pills */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon as={lucide.Users} size="sm" style={{ color: "#FFFFFF" }} />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
                {wheelParticipants.length} Participants
              </Text>
            </View>
            {selectedItem && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon as={lucide.Gift} size="sm" style={{ color: "#FFFFFF" }} />
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }} numberOfLines={1}>
                  {selectedItem.productName} — {selectedItem.points} pts
                </Text>
              </View>
            )}
          </View>

          {/* The Wheel */}
          <FortuneWheel
            options={wheelOptions}
            colors={wheelColors}
            onSpinEnd={handleSpinEnd}
            isSpinning={spinning}
            size={wheelSize}
          />

          {/* Spin Button */}
          <Pressable
            onPress={handleSpin}
            disabled={spinning || wheelParticipants.length < 1}
            style={{
              backgroundColor: spinning ? "#4B5563" : "#273C73",
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderRadius: 14,
              opacity: spinning ? 0.6 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              as={spinning ? lucide.Loader2 : lucide.Sparkles}
              size="md"
              style={{ color: "#FFFFFF" }}
            />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 18 }}>
              {spinning ? "Spinning..." : "Spin the Wheel!"}
            </Text>
          </Pressable>
        </VStack>

        {/* Winner Dialog */}
        <WinnerDialog
          winner={winner}
          onClose={handleCloseWinner}
          selectedItemName={selectedItem?.productName}
          redemptionStatus={redemptionStatus}
          redemptionError={redemptionError}
        />
      </View>
    );
  }

  // ===== PHASE 1: SETUP =====

  const renderResidentPanel = () => (
    <VStack
      className="flex-1 bg-white rounded-2xl"
      style={{ padding: isMobile ? 12 : 20, gap: 12 }}
    >
      {/* Panel Header (desktop) */}
      {!isMobile && (
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3">
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }}>
              <Icon as={lucide.Users} size="sm" style={{ color: "#6366F1" }} />
            </View>
            <VStack>
              <Heading size="md" style={{ color: "#1F2937" }}>Select Residents</Heading>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{filteredResidents.length} of {residents.length} shown</Text>
            </VStack>
          </HStack>
          <HStack className="gap-2">
            <Pressable onPress={handleSelectAll} style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: "#6366F1", fontWeight: "600" }}>All</Text>
            </Pressable>
            <Pressable onPress={handleDeselectAll} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>None</Text>
            </Pressable>
          </HStack>
        </HStack>
      )}

      {/* Quick actions (mobile) */}
      {isMobile && (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#9CA3AF", flex: 1 }}>{filteredResidents.length} of {residents.length} residents</Text>
          <Pressable onPress={handleSelectAll} style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: "#6366F1", fontWeight: "600" }}>All</Text>
          </Pressable>
          <Pressable onPress={handleDeselectAll} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>None</Text>
          </Pressable>
        </View>
      )}

      {/* Search + Filter */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Input variant="outline" size="md" className="flex-1" style={{ borderRadius: 12, borderColor: "#E5E7EB" }}>
          <InputSlot className="pl-3"><InputIcon as={Search} style={{ color: "#9CA3AF" }} /></InputSlot>
          <InputField placeholder="Search residents..." value={search} onChangeText={setSearch} style={{ color: "#374151" }} />
          {search.length > 0 && (
            <InputSlot className="pr-3"><Pressable onPress={() => setSearch("")}><InputIcon as={X} style={{ color: "#9CA3AF" }} /></Pressable></InputSlot>
          )}
        </Input>
        <FilterButton activeFilterCount={activeFilterCount} onPress={() => setFilterModalOpen(true)} />
      </View>

      <ActiveFilterPills filters={filters} onClearMinPoints={() => setFilters((f) => ({ ...f, minPoints: "" }))} onClearSortOrder={() => setFilters((f) => ({ ...f, sortOrder: "none" }))} />

      {selectedResidents.length > 0 && (
        <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon as={lucide.CheckCircle2} size="sm" style={{ color: "#6366F1" }} />
          <Text style={{ fontSize: 13, color: "#4338CA", fontWeight: "600" }}>{selectedResidents.length} selected for spin</Text>
        </View>
      )}

      {loading ? (
        <CustomSpinner text="Loading residents..." />
      ) : filteredResidents.length === 0 ? (
        <EmptyAlert text="No residents found!" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20, gap: 8 }}>
          {filteredResidents.map((res) => (
            <ResidentCard
              key={res.id}
              resident={res}
              isSelected={selectedResidents.includes(res.id.toString())}
              isEligible={!selectedItem || (res.currentPoints ?? 0) >= selectedItem.points}
              onToggle={toggleResident}
            />
          ))}
        </ScrollView>
      )}
    </VStack>
  );

  return (
    <View className="flex-1 bg-indigoscale-500">
      {isMobile ? (
        /* ===== MOBILE: Tabbed layout ===== */
        <View style={{ flex: 1, padding: 12, paddingBottom: readyToSpin ? 72 : 12 }}>
          {/* Tab bar */}
          <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 3, marginBottom: 12 }}>
            <Pressable
              onPress={() => setSetupTab("prize")}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10,
                backgroundColor: setupTab === "prize" ? "#FFFFFF" : "transparent",
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
              }}
            >
              <Icon as={lucide.Gift} size="xs" style={{ color: setupTab === "prize" ? "#273C73" : "rgba(255,255,255,0.7)" }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: setupTab === "prize" ? "#273C73" : "rgba(255,255,255,0.7)" }}>
                Prize{selectedItemId ? " ✓" : ""}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSetupTab("residents")}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10,
                backgroundColor: setupTab === "residents" ? "#FFFFFF" : "transparent",
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
              }}
            >
              <Icon as={lucide.Users} size="xs" style={{ color: setupTab === "residents" ? "#273C73" : "rgba(255,255,255,0.7)" }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: setupTab === "residents" ? "#273C73" : "rgba(255,255,255,0.7)" }}>
                Residents{selectedResidents.length > 0 ? ` (${selectedResidents.length})` : ""}
              </Text>
            </Pressable>
          </View>

          {/* Tab content — full remaining height */}
          {setupTab === "prize" ? (
            <PrizeSelector products={showcaseProducts} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} itemSearch={itemSearch} onSearchChange={setItemSearch} />
          ) : (
            renderResidentPanel()
          )}
        </View>
      ) : (
        /* ===== DESKTOP: Side-by-side ===== */
        <View style={{ flexDirection: 'row', flex: 1, gap: 20, padding: 20, paddingBottom: readyToSpin ? 80 : 20 }}>
          <PrizeSelector products={showcaseProducts} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} itemSearch={itemSearch} onSearchChange={setItemSearch} />
          {renderResidentPanel()}
        </View>
      )}

      {/* Ready to Spin Bar */}
      {readyToSpin && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#273C73", paddingHorizontal: isMobile ? 14 : 20, paddingVertical: isMobile ? 10 : 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
          <VStack>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: isMobile ? 14 : 15 }}>Ready to spin!</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{selectedItem?.productName} · {selectedResidents.length} participant{selectedResidents.length !== 1 ? "s" : ""}</Text>
          </VStack>
          <Pressable onPress={() => setPhase("spin")} style={{ backgroundColor: "#FFFFFF", paddingHorizontal: isMobile ? 16 : 24, paddingVertical: isMobile ? 10 : 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon as={lucide.Sparkles} size="sm" style={{ color: "#273C73" }} />
            <Text style={{ color: "#273C73", fontWeight: "800", fontSize: isMobile ? 14 : 15 }}>Go to Wheel</Text>
          </Pressable>
        </View>
      )}

      <FilterModal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} filters={filters} onApply={setFilters} />
    </View>
  );
};

export default LotteryPage;



