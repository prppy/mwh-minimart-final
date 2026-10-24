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

  // Cards fill the page width: 1 column on phones, 2 on tablets, 3 on wide screens
  const padding = isMobile ? 12 : 24;
  const gap = 16;
  const columns = isMobile || selectedCategoryId !== null ? 1 : width >= 1400 ? 3 : 2;
  const available = contentWidth || width - padding * 2;
  const cardWidth = (available - gap * (columns - 1)) / columns;

  const chip = (label: string, on: boolean, onPress: () => void, icon: any, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: on ? BLUE : "#ffffff",
        borderWidth: 1,
        borderColor: on ? BLUE : "#D1D5DB",
      }}
    >
      <Icon as={icon} size="sm" style={{ color: on ? "#ffffff" : BLUE }} />
      <Text style={{ fontWeight: "700", color: on ? "#ffffff" : BLUE }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#eef1f7" }}
      contentContainerStyle={{ padding }}
    >
      <View
        style={{ width: "100%", gap: 16 }}
        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: BLUE }}>Vouchers</Text>
          <Text style={{ fontSize: 15, color: "#5a6178", fontWeight: "600" }}>
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
            {visibleCategories.map((cat) => {
              const tasks = subtasksByCategory.get(cat.id) || [];
              return (
                <View
                  key={cat.id}
                  style={{
                    width: Math.floor(cardWidth),
                    backgroundColor: "#ffffff",
                    borderRadius: 20,
                    padding: 18,
                    gap: 12,
                    shadowColor: BLUE,
                    shadowOpacity: 0.06,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "#E0E7FF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon as={getVoucherIcon(cat.iconName)} size="lg" style={{ color: BLUE }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "900", color: BLUE }}>{cat.taskCategoryName}</Text>
                      {!!cat.taskCategoryDescription && (
                        <Text style={{ fontSize: 14, color: "#5a6178" }}>{cat.taskCategoryDescription}</Text>
                      )}
                    </View>
                  </View>

                  {tasks.length === 0 ? (
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <Icon as={Info} size="sm" style={{ color: "#9CA3AF" }} />
                      <Text style={{ color: "#6B7280" }}>Tasks for this category are coming soon.</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 2 }}>
                      {tasks.map((task) => (
                        <View
                          key={task.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            paddingVertical: 10,
                            borderTopWidth: 1,
                            borderColor: "#F1F3F8",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", color: "#1c2340" }}>{task.taskName}</Text>
                            {!!task.taskDescription && (
                              <Text style={{ fontSize: 13, color: "#6B7280" }}>{task.taskDescription}</Text>
                            )}
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontSize: 18, fontWeight: "900", color: ORANGE }}>+{task.points}</Text>
                            <Text style={{ fontSize: 11, color: "#9CA3AF" }}>pts</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default VouchersPage;
