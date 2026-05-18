import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import {
  ArrowDownAZ,
  ArrowUpZA,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react-native";

import api from "@/utils/api";
import { Resident, WheelParticipant } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import FortuneWheel from "@/components/custom-fortune-wheel";
import SearchBar from "@/components/custom-searchbar";
import CustomSpinner from "@/components/custom-spinner";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import Checkbox from "@/components/custom-checkbox";
import { Center } from "@/components/ui/center";
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

// Winner Dialog

interface WinnerDialogProps {
  winner: string | null;
  onClose: () => void;
}

const WinnerDialog: React.FC<WinnerDialogProps> = ({ winner, onClose }) => (
  <alert.AlertDialog isOpen={!!winner} onClose={onClose}>
    <alert.AlertDialogBackdrop />
    <alert.AlertDialogContent>
      <alert.AlertDialogHeader>
        <Heading size="lg" className="text-indigoscale-700">
          {winner?.startsWith("Error") ? "Oops!" : "🎉 Congratulations!"}
        </Heading>
      </alert.AlertDialogHeader>
      <alert.AlertDialogBody className="mt-2 mb-4">
        <Text className="text-xl text-center" bold>
          {winner}
        </Text>
      </alert.AlertDialogBody>
      <alert.AlertDialogFooter>
        <Button
          action="primary"
          size="sm"
          onPress={onClose}
          className="bg-indigoscale-700"
        >
          <ButtonText>Awesome!</ButtonText>
        </Button>
      </alert.AlertDialogFooter>
    </alert.AlertDialogContent>
  </alert.AlertDialog>
);

// Resident list item

interface ResidentListItemProps {
  resident: Resident;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ResidentListItem: React.FC<ResidentListItemProps> = ({
  resident,
  isSelected,
  onToggle,
}) => (
  <Checkbox
    key={resident.id}
    value={resident.id.toString()}
    isChecked={isSelected}
    onChange={() => onToggle(resident.id.toString())}
    className="w-full"
  >
    <VStack
      className={`flex-1 bg-${resident.wallpaperType}scale-300 p-3 border-2 border-${resident.wallpaperType}scale-500 rounded-xl`}
    >
      <Heading
        size="lg"
        className={`text-${resident.wallpaperType}scale-700`}
        bold
      >
        {resident.userName}
      </Heading>
      <Text className={`text-${resident.wallpaperType}scale-700`}>
        Points: {resident.currentPoints ?? 0} | Batch:{" "}
        {resident.batchNumber || "-"}
      </Text>
    </VStack>
  </Checkbox>
);

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
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // committed filter state: updated only when user presses Apply
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // data fetching

  useEffect(() => {
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
      result = [...result].sort((a, b) => {
        const cmp = a.userName.localeCompare(b.userName);
        return filters.sortOrder === "asc" ? cmp : -cmp;
      });
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
    setSelectedResidents(filteredResidents.map((res) => res.id.toString()));

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
    setTimeout(() => {
      setWinner(winnerName);
      const winnerParticipant = wheelParticipants.find(
        (p) => p.name === winnerName,
      );
      if (winnerParticipant) {
        setSelectedResidents((prev) =>
          prev.filter((id) => id !== winnerParticipant.id),
        );
      }
    }, 500);
  };

  const toggleResident = (resId: string) => {
    setSelectedResidents((prev) =>
      prev.includes(resId)
        ? prev.filter((id) => id !== resId)
        : [...prev, resId],
    );
  };

  // render

  return (
    <HStack className="flex-1 bg-indigoscale-500 gap-5 p-5">
      {/* Spin & Win Wheel */}
      <VStack className="flex-1" space="lg">
        <Center className="w-full h-full gap-5 p-5">
          <FortuneWheel
            options={wheelOptions}
            colors={wheelColors}
            onSpinEnd={handleSpinEnd}
            isSpinning={spinning}
          />
          <VStack space="md">
            <Button
              action="secondary"
              onPress={handleSpin}
              disabled={spinning || wheelParticipants.length < 1}
            >
              <ButtonText>
                {spinning ? "Spinning..." : "Spin the Wheel!"}
              </ButtonText>
            </Button>
            <Text className="text-white text-center" bold>
              Participants: {wheelParticipants.length}
            </Text>
          </VStack>
        </Center>
      </VStack>

      {/* Resident Selection Panel */}
      <VStack className="flex-1 bg-white gap-3 p-5 rounded-2xl">
        <Heading className="text-indigoscale-700" size="xl">
          Select Residents
        </Heading>

        {/* Toolbar */}
        <HStack space="sm" className="items-center">
          <HStack className="flex-1">
            <SearchBar search={search} setSearch={setSearch} />
          </HStack>

          <FilterButton
            activeFilterCount={activeFilterCount}
            onPress={() => setFilterModalOpen(true)}
          />

          <Button action="secondary" size="sm" onPress={handleSelectAll}>
            <ButtonText>Select All</ButtonText>
          </Button>
          <Button action="secondary" size="sm" onPress={handleDeselectAll}>
            <ButtonText>Deselect All</ButtonText>
          </Button>
        </HStack>

        {/* Active filter pills — dismissable inline */}
        <ActiveFilterPills
          filters={filters}
          onClearMinPoints={() => setFilters((f) => ({ ...f, minPoints: "" }))}
          onClearSortOrder={() =>
            setFilters((f) => ({ ...f, sortOrder: "none" }))
          }
        />

        {/* Count */}
        <Text className="text-gray-400 text-xs">
          Showing {filteredResidents.length} of {residents.length} residents
        </Text>

        {/* Resident list */}
        {loading ? (
          <CustomSpinner text="Loading residents..." />
        ) : filteredResidents.length === 0 ? (
          <EmptyAlert text="No residents found!" />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <VStack space="sm">
              {filteredResidents.map((res) => (
                <ResidentListItem
                  key={res.id}
                  resident={res}
                  isSelected={selectedResidents.includes(res.id.toString())}
                  onToggle={toggleResident}
                />
              ))}
            </VStack>
          </ScrollView>
        )}
      </VStack>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* Winner Dialog */}
      <WinnerDialog winner={winner} onClose={() => setWinner(null)} />
    </HStack>
  );
};

export default LotteryPage;
