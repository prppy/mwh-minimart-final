import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Info, Layers } from "lucide-react-native";

import api from "@/utils/api";
import { TaskCategory, Voucher } from "@/utils/types";
import { getVoucherIcon } from "@/constants/voucher-icons";

import EmptyAlert from "@/components/custom-empty-alert";
import Spinner from "@/components/custom-spinner";
import { Icon } from "@/components/ui/icon";

const MOBILE_BREAKPOINT = 768;
const BLUE = "#1f3a93";
const ORANGE = "#e8502a";
const INK = "#1c2340";
const MUTED = "#5a6178";
const LINE = "#e1e5ef";
const PAGE = "#f2f4f9";

/**
 * Vouchers information page: each category with its subtasks and the points
 * residents earn for them. Staff award the points from Voucher Management.
 */
const VouchersPage: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [subtasks, setSubtasks] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  // Measured, because the window width includes the scrollbar on web
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [categoriesRes, tasksRes] = await Promise.all([
          api.get("taskCategories"),
          api.get("tasks", { params: { limit: 500 } }),
        ]);
        setCategories(categoriesRes.data.data || []);
        setSubtasks(tasksRes.data.data?.tasks || []);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subtasksByCategory = useMemo(() => {
    const map = new Map<number, Voucher[]>();
    for (const task of subtasks) {
      const list = map.get(task.taskCategoryId) || [];
      list.push(task);
      map.set(task.taskCategoryId, list);
    }
    for (const list of map.values()) list.sort((a, b) => (a.points ?? 0) - (b.points ?? 0));
    return map;
  }, [subtasks]);

  const visibleCategories =
    selectedCategoryId === null ? categories : categories.filter((c) => c.id === selectedCategoryId);

  if (loading) return <Spinner text="Loading vouchers..." />;

  const padding = isMobile ? 12 : 24;
  const available = contentWidth || width - padding * 2;
  // Task tiles inside a category section: 1 column on phones, up to 4 on wide screens
  const tileGap = 12;
  const sectionPadding = isMobile ? 16 : 20;
  const tilesWidth = available - sectionPadding * 2 - 2; // minus the section border
  const tileColumns = tilesWidth >= 1100 ? 4 : tilesWidth >= 780 ? 3 : tilesWidth >= 480 ? 2 : 1;
  const tileWidth = Math.floor((tilesWidth - tileGap * (tileColumns - 1)) / tileColumns);

  // Categories without tasks share one "coming soon" row instead of empty cards
  const withTasks = visibleCategories.filter((c) => (subtasksByCategory.get(c.id) || []).length > 0);
  const comingSoon = visibleCategories.filter((c) => (subtasksByCategory.get(c.id) || []).length === 0);

  const chip = (label: string, on: boolean, onPress: () => void, icon: any, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      style={({ hovered }: any) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: on ? BLUE : hovered ? "#EEF1F8" : "#ffffff",
        borderWidth: 1,
        borderColor: on ? BLUE : LINE,
      })}
    >
      <Icon as={icon} size="sm" style={{ color: on ? "#ffffff" : BLUE }} />
      <Text style={{ fontWeight: "600", color: on ? "#ffffff" : INK }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAGE }} contentContainerStyle={{ padding }}>
      <View style={{ width: "100%", gap: 20 }} onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}>
        <View style={{ gap: 6, maxWidth: 720 }}>
          <Text style={{ fontSize: isMobile ? 26 : 32, fontWeight: "800", color: INK, letterSpacing: -0.5 }}>
            Vouchers
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 23, color: MUTED }}>
            Earn points by completing these tasks. Staff will award your points when you complete
            a task — then redeem them at the minimart.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {chip("All", selectedCategoryId === null, () => setSelectedCategoryId(null), Layers, "all")}
            {categories.map((cat) =>
              chip(
                cat.taskCategoryName,
                selectedCategoryId === cat.id,
                () => setSelectedCategoryId(cat.id),
                getVoucherIcon(cat.iconName),
                String(cat.id)
              )
            )}
          </View>
        </ScrollView>

        {categories.length === 0 ? (
          <EmptyAlert text="No vouchers yet!" />
        ) : (
          <View style={{ gap: 16 }}>
            {withTasks.map((cat) => {
              const tasks = subtasksByCategory.get(cat.id) || [];
              const top = tasks[tasks.length - 1]?.points ?? 0;
              return (
                <View
                  key={cat.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: LINE,
                    padding: sectionPadding,
                    gap: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "#E6EBF7",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon as={getVoucherIcon(cat.iconName)} size="lg" style={{ color: BLUE }} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: INK }}>{cat.taskCategoryName}</Text>
                      {!!cat.taskCategoryDescription && (
                        <Text style={{ fontSize: 14, color: MUTED }}>{cat.taskCategoryDescription}</Text>
                      )}
                    </View>
                    {!isMobile && (
                      <Text style={{ fontSize: 13, color: MUTED }}>
                        {tasks.length} {tasks.length === 1 ? "task" : "tasks"}, up to{" "}
                        <Text style={{ color: ORANGE, fontWeight: "700" }}>+{top} pts</Text>
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tileGap }}>
                    {tasks.map((task) => (
                      <View
                        key={task.id}
                        style={{
                          width: tileWidth,
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: 14,
                          borderRadius: 14,
                          backgroundColor: PAGE,
                        }}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontWeight: "600", color: INK }}>{task.taskName}</Text>
                          {!!task.taskDescription && (
                            <Text style={{ fontSize: 13, lineHeight: 19, color: MUTED }}>{task.taskDescription}</Text>
                          )}
                        </View>
                        <View
                          style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#FDEEE9" }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "800", color: ORANGE }}>+{task.points} pts</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {comingSoon.length > 0 && (
              <View
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: 12,
                  padding: sectionPadding,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#C9D1E4",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Icon as={Info} size="sm" style={{ color: MUTED }} />
                  <Text style={{ color: MUTED, fontWeight: "600" }}>{comingSoon.length === 1 ? "Tasks for this category are coming soon." : "Tasks for these categories are coming soon."}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, flex: isMobile ? undefined : 1 }}>
                  {comingSoon.map((cat) => (
                    <View
                      key={cat.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <Icon as={getVoucherIcon(cat.iconName)} size="xs" style={{ color: BLUE }} />
                      <Text style={{ fontSize: 13, color: INK }}>{cat.taskCategoryName}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default VouchersPage;
