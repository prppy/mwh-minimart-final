import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Pressable, Platform } from "react-native";

let DatePicker: any = null;
if (Platform.OS === "web") {
  DatePicker = require("react-datepicker").default;
  require("react-datepicker/dist/react-datepicker.css");
}
import {
  Award,
  Shield,
  Home,
  Layers,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  Heart,
  Wrench,
  X,
  ArrowUpDown,
  Tag,
  Gift,
  Zap,
  BookOpen,
  Coffee,
  Music,
  Smile,
  Sun,
  Moon,
  Cloud,
  Flame,
  Anchor,
  Bell,
  Camera,
  Compass,
  Feather,
  Key,
  Map,
} from "lucide-react-native";

const ICON_MAP: Record<string, any> = {
  tag: Tag,
  gift: Gift,
  star: Star,
  award: Award,
  heart: Heart,
  zap: Zap,
  shield: Shield,
  book: BookOpen,
  coffee: Coffee,
  music: Music,
  smile: Smile,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  flame: Flame,
  anchor: Anchor,
  bell: Bell,
  camera: Camera,
  compass: Compass,
  feather: Feather,
  key: Key,
  map: Map,
};

import api from "@/utils/api";
import { Voucher, TaskCategory } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import Spinner from "@/components/custom-spinner";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// Map category names to icons and descriptions
const CATEGORY_META: Record<
  string,
  { icon: any; color: string; description: string }
> = {
  achievement: {
    icon: Award,
    color: "bg-amber-100",
    description:
      "Recognition vouchers for personal milestones, good behavior, and outstanding contributions.",
  },
  community_service: {
    icon: Heart,
    color: "bg-rose-100",
    description:
      "Rewards for community service activities and helping others in the community.",
  },
  good_conduct: {
    icon: Star,
    color: "bg-emerald-100",
    description:
      "Vouchers for maintaining exemplary conduct and following house rules.",
  },
  maintenance: {
    icon: Wrench,
    color: "bg-sky-100",
    description:
      "Vouchers for helping with maintenance, cleaning, and upkeep of facilities.",
  },
  "Non-Homeleavers (USB)": {
    icon: Home,
    color: "bg-blue-100",
    description:
      "Vouchers for residents who do not go on home leave. USB stands for Urine Supervision Bonus.",
  },
  "Abscondence Free Challenge": {
    icon: Shield,
    color: "bg-green-100",
    description:
      "Rewards for residents who maintain a clean record with no abscondence incidents.",
  },
  Achievements: {
    icon: Award,
    color: "bg-yellow-100",
    description:
      "Recognition vouchers for personal milestones, good behavior, and outstanding contributions.",
  },
};

const DEFAULT_META = {
  icon: Layers,
  color: "bg-gray-100",
  description: "",
};

type SortField = "latest" | "points";
type SortDir = "desc" | "asc";

const VouchersPage: React.FC = () => {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("latest");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Date range state
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vouchersRes, categoriesRes] = await Promise.all([
          api.get("tasks"),
          api.get("taskCategories"),
        ]);
        setVouchers(vouchersRes.data.data.tasks || []);
        setTaskCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = useCallback((dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-SG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];

    if (selectedCategoryId !== null) {
      result = result.filter((v) => v.taskCategoryId === selectedCategoryId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.taskName?.toLowerCase().includes(q) ||
          v.taskDescription?.toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter((v) => new Date(v.taskDate) >= dateFrom);
    }
    if (dateTo) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59, 999);
      result = result.filter((v) => new Date(v.taskDate) <= toEnd);
    }

    result.sort((a, b) => {
      if (sortField === "points") {
        return sortDir === "asc"
          ? (a.points ?? 0) - (b.points ?? 0)
          : (b.points ?? 0) - (a.points ?? 0);
      }
      const dateA = new Date(a.taskDate).getTime();
      const dateB = new Date(b.taskDate).getTime();
      if (dateA !== dateB) {
        return sortDir === "asc" ? dateA - dateB : dateB - dateA;
      }
      return sortDir === "asc" ? a.id - b.id : b.id - a.id;
    });

    return result;
  }, [vouchers, selectedCategoryId, search, sortField, sortDir, dateFrom, dateTo]);

  const getCategoryMeta = (cat: TaskCategory | null) => {
    if (!cat) return DEFAULT_META;

    // Use icon from DB if available
    if (cat.iconName && ICON_MAP[cat.iconName]) {
      return {
        icon: ICON_MAP[cat.iconName],
        color: "bg-indigoscale-100",
        description: cat.taskCategoryDescription || ""
      };
    }

    const name = cat.taskCategoryName || "";
    return (
      CATEGORY_META[name] ||
      CATEGORY_META[name.toLowerCase()] ||
      CATEGORY_META[name.toLowerCase().replace(/\s+/g, "_")] ||
      DEFAULT_META
    );
  };

  const hasDateFilter = dateFrom || dateTo;

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (loading) {
    return (
      <Center className="flex-1 bg-indigoscale-100">
        <Spinner text="Loading vouchers..." />
      </Center>
    );
  }

  // Find the selected category info for description
  const selectedCat = selectedCategoryId !== null
    ? taskCategories.find((c) => c.id === selectedCategoryId)
    : null;
  const selectedMeta = selectedCat
    ? getCategoryMeta(selectedCat)
    : null;

  return (
    <VStack className="flex-1 p-5 bg-indigoscale-100">
      {/* Category Tabs + Description — wrapped in one VStack to eliminate gap */}
      <VStack space="md">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space="sm">
            <Pressable onPress={() => setSelectedCategoryId(null)}>
              <HStack
                className={`items-center px-4 py-2 rounded-full ${selectedCategoryId === null
                  ? "bg-indigoscale-700"
                  : "bg-white border border-gray-300"
                  }`}
                space="sm"
              >
                <Icon
                  as={Layers}
                  size="sm"
                  className={selectedCategoryId === null ? "text-white" : "text-indigoscale-700"}
                />
                <Text
                  className={selectedCategoryId === null ? "text-white" : "text-indigoscale-700"}
                  bold
                >
                  All
                </Text>
              </HStack>
            </Pressable>

            {taskCategories.map((cat) => {
              const meta = getCategoryMeta(cat);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <Pressable key={cat.id} onPress={() => setSelectedCategoryId(cat.id)}>
                  <HStack
                    className={`items-center px-4 py-2 rounded-full ${isSelected ? "bg-indigoscale-700" : "bg-white border border-gray-300"
                      }`}
                    space="sm"
                  >
                    <Icon
                      as={meta.icon}
                      size="sm"
                      className={isSelected ? "text-white" : "text-indigoscale-700"}
                    />
                    <Text
                      className={isSelected ? "text-white" : "text-indigoscale-700"}
                      bold
                    >
                      {cat.taskCategoryName}
                    </Text>
                  </HStack>
                </Pressable>
              );
            })}
          </HStack>
        </ScrollView>

        {/* Category Description — directly under tabs with minimal spacing */}
        {selectedCat && selectedMeta && (
          <HStack className="bg-white p-3 rounded-lg border border-gray-200 items-start" space="sm">
            <Icon as={Info} size="sm" className="text-indigoscale-500 mt-0.5" />
            <VStack className="flex-1">
              <Text className="text-indigoscale-700" bold size="sm">
                {selectedCat.taskCategoryName}
              </Text>
              <Text className="text-gray-500" size="xs">
                {selectedCat.taskCategoryDescription || selectedMeta.description}
              </Text>
            </VStack>
          </HStack>
        )}
      </VStack>

      {/* Search & Sort Controls */}
      <HStack className="items-center gap-3 mt-3">
        <HStack className="flex-1 items-center bg-white border border-gray-300 rounded-lg px-3">
          <Icon as={Search} size="sm" className="text-gray-400" />
          <Input variant="outline" className="flex-1 border-0">
            <InputField
              placeholder="Search vouchers..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>
        </HStack>

        {/* Date button — toggles date range */}
        <Pressable onPress={() => setShowDateRange(!showDateRange)}>
          <HStack
            className={`items-center px-3 py-2 rounded-lg ${showDateRange || hasDateFilter
              ? "bg-indigoscale-700"
              : "bg-white border border-gray-300"
              }`}
            space="xs"
          >
            <Icon
              as={Calendar}
              size="sm"
              className={showDateRange || hasDateFilter ? "text-white" : "text-indigoscale-700"}
            />
            <Text
              size="sm"
              className={showDateRange || hasDateFilter ? "text-white" : "text-indigoscale-700"}
              bold
            >
              Date
            </Text>
            <Icon
              as={showDateRange ? ChevronUp : ChevronDown}
              size="xs"
              className={showDateRange || hasDateFilter ? "text-white" : "text-indigoscale-700"}
            />
          </HStack>
        </Pressable>

        {/* Sort by points */}
        <Pressable
          onPress={() => {
            if (sortField === "points") {
              setSortDir((d) => (d === "desc" ? "asc" : "desc"));
            } else {
              setSortField("points");
              setSortDir("desc");
            }
          }}
        >
          <HStack
            className={`items-center px-3 py-2 rounded-lg ${sortField === "points"
              ? "bg-indigoscale-700"
              : "bg-white border border-gray-300"
              }`}
            space="xs"
          >
            <Icon
              as={ArrowUpDown}
              size="sm"
              className={sortField === "points" ? "text-white" : "text-indigoscale-700"}
            />
            <Text
              size="sm"
              className={sortField === "points" ? "text-white" : "text-indigoscale-700"}
              bold
            >
              Points
            </Text>
            {sortField === "points" && (
              <Icon
                as={sortDir === "desc" ? ChevronDown : ChevronUp}
                size="xs"
                className="text-white"
              />
            )}
          </HStack>
        </Pressable>
      </HStack>

      {/* Date Range — revealed when Date button is pressed */}
      {showDateRange && (
        <HStack className="items-end gap-3 mt-2 bg-white p-3 rounded-lg border border-gray-200 z-50" style={{ overflow: 'visible' }}>
          <VStack className="flex-1" space="xs">
            <Text size="xs" className="text-gray-500" bold>
              From
            </Text>
            {Platform.OS === "web" && DatePicker ? (
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => setDateFrom(date || undefined)}
                selectsStart
                startDate={dateFrom}
                endDate={dateTo}
                maxDate={dateTo}
                placeholderText="Select start date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                wrapperClassName="w-full"
              />
            ) : (
              <Text className="text-sm text-gray-500">Web only</Text>
            )}
          </VStack>
          <Text className="text-gray-400 mb-2">→</Text>
          <VStack className="flex-1" space="xs">
            <Text size="xs" className="text-gray-500" bold>
              To
            </Text>
            {Platform.OS === "web" && DatePicker ? (
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => setDateTo(date || undefined)}
                selectsEnd
                startDate={dateFrom}
                endDate={dateTo}
                minDate={dateFrom}
                placeholderText="Select end date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                wrapperClassName="w-full"
              />
            ) : (
              <Text className="text-sm text-gray-500">Web only</Text>
            )}
          </VStack>
          {hasDateFilter && (
            <Pressable onPress={clearDateFilter} className="mb-2">
              <HStack className="items-center px-3 py-2 bg-red-50 rounded-lg border border-red-200" space="xs">
                <Icon as={X} size="xs" className="text-red-500" />
                <Text size="xs" className="text-red-500" bold>
                  Clear
                </Text>
              </HStack>
            </Pressable>
          )}
        </HStack>
      )}

      <Divider className="mt-3" />

      {/* Voucher List */}
      {filteredVouchers.length === 0 ? (
        <EmptyAlert text="No vouchers found!" />
      ) : (
        <ScrollView className="flex-1 mt-3">
          <VStack space="md">
            {filteredVouchers.map((voucher) => {
              const cat = voucher.taskCategory;
              const meta = getCategoryMeta(cat);

              return (
                <Pressable
                  key={voucher.id}
                  onPress={() => router.push(`/vouchers/${voucher.id}`)}
                >
                  <HStack
                    className="bg-white p-4 rounded-lg border border-gray-200 items-center"
                    space="md"
                  >
                    <Center className={`w-12 h-12 rounded-full ${meta.color}`}>
                      <Icon
                        as={meta.icon}
                        size="md"
                        className="text-indigoscale-700"
                      />
                    </Center>

                    <VStack className="flex-1" space="xs">
                      <Text className="text-indigoscale-700" bold size="md">
                        {voucher.taskName}
                      </Text>
                      <HStack space="sm" className="items-center flex-wrap">
                        <Badge size="sm" action="muted">
                          <BadgeText>{cat?.taskCategoryName}</BadgeText>
                        </Badge>
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={Calendar}
                            size="2xs"
                            className="text-gray-400"
                          />
                          <Text className="text-gray-400" size="xs">
                            {formatDate(voucher.taskDate)}
                          </Text>
                        </HStack>
                        {voucher.taskDescription && (
                          <Text
                            className="text-gray-400 flex-1"
                            size="xs"
                            numberOfLines={1}
                          >
                            {voucher.taskDescription}
                          </Text>
                        )}
                      </HStack>
                    </VStack>

                    <VStack className="items-end">
                      <Heading className="text-indigoscale-700" size="lg">
                        {voucher.points}
                      </Heading>
                      <Text className="text-gray-400" size="xs">
                        pts
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        </ScrollView>
      )}
    </VStack>
  );
};

export default VouchersPage;
