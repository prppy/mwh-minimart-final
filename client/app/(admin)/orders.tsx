import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, PackageCheck, Search, XCircle } from "lucide-react-native";

import api from "@/utils/api";
import { Order } from "@/utils/types";

import OrderCard from "@/components/order-card";
import Spinner from "@/components/custom-spinner";
import { Button, ButtonIcon, ButtonText } from "@/components/button";
import * as alert from "@/components/ui/alert-dialog";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const MOBILE_BREAKPOINT = 768;
const AUTO_REFRESH_MS = 30 * 1000;

type Scope = "active" | "history";
type TypeFilter = "all" | "normal" | "preorder";
type NextStatus = "ready" | "collected" | "cancelled";

const ACTION_LABEL: Record<NextStatus, string> = {
  ready: "Mark ready to collect",
  collected: "Mark collected",
  cancelled: "Cancel & refund",
};

const OrdersAdminPage: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [scope, setScope] = useState<Scope>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("orders", {
        params: {
          scope,
          ...(typeFilter !== "all" && { type: typeFilter }),
          limit: 300,
        },
      });
      setOrders(res.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err?.message || "Could not load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope, typeFilter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
      const timer = setInterval(fetchOrders, AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [fetchOrders])
  );

  const changeStatus = async (order: Order, status: NextStatus) => {
    setBusyId(order.id);
    try {
      await api.patch(`orders/${order.id}/status`, { status }, { retries: 0 });
      await fetchOrders();
    } catch (err: any) {
      setError(err?.message || "Could not update the order.");
      await fetchOrders();
    } finally {
      setBusyId(null);
    }
  };

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.ticketCode.toLowerCase().includes(q) ||
        (o.userName || "").toLowerCase().includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const nextActions = (order: Order): NextStatus[] => {
    if (order.status === "pending") return ["collected", "cancelled"];
    if (order.status === "preordered") return ["ready", "cancelled"];
    if (order.status === "ready") return ["collected", "cancelled"];
    return [];
  };

  const pill = (active: boolean) =>
    active ? "bg-indigoscale-700 border-indigoscale-700" : "bg-white border-indigoscale-300";
  const pillText = (active: boolean) => (active ? "text-white" : "text-indigoscale-700");

  return (
    <VStack className="flex-1 bg-[#f2f4f9]">
      <VStack space="md" style={{ padding: isMobile ? 12 : 20 }}>
        <HStack className="justify-between items-center" style={{ flexWrap: "wrap", gap: 8 }}>
          <Heading size="xl" style={{ color: "#1f3a93" }}>
            Redemption Orders
          </Heading>
          <HStack space="sm">
            {(["active", "history"] as Scope[]).map((s) => (
              <Button key={s} size="sm" variant="outline" className={pill(scope === s)} onPress={() => setScope(s)}>
                <ButtonText className={pillText(scope === s)}>
                  {s === "active" ? "Active" : "History"}
                </ButtonText>
              </Button>
            ))}
          </HStack>
        </HStack>

        <View style={{ flexDirection: isMobile ? "column" : "row", gap: 8 }}>
          <HStack className="flex-1 items-center bg-white rounded-lg px-3 border border-gray-300">
            <Icon as={Search} size="sm" className="text-gray-400" />
            <Input className="flex-1 border-0">
              <InputField placeholder="Search ticket, resident or item" value={search} onChangeText={setSearch} />
            </Input>
          </HStack>
          <HStack space="sm">
            {([
              ["all", "All"],
              ["normal", "Counter"],
              ["preorder", "Pre-orders"],
            ] as [TypeFilter, string][]).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                className={pill(typeFilter === value)}
                onPress={() => setTypeFilter(value)}
              >
                <ButtonText className={pillText(typeFilter === value)}>{label}</ButtonText>
              </Button>
            ))}
          </HStack>
        </View>

        {error && <Text className="text-redscale-700">{error}</Text>}
      </VStack>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: isMobile ? 12 : 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
          />
        }
      >
        {loading ? (
          <Spinner text="Loading orders..." />
        ) : visibleOrders.length === 0 ? (
          <Text className="text-gray-600">
            {scope === "active" ? "No tickets waiting." : "No past orders found."}
          </Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {visibleOrders.map((order) => (
              <View key={order.id} style={{ width: isMobile ? "100%" : "49%" }}>
                <OrderCard
                  order={order}
                  staffView
                  actions={
                    nextActions(order).length > 0 && (
                      <HStack space="sm" style={{ flexWrap: "wrap", gap: 8 }}>
                        {nextActions(order).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            action={status === "cancelled" ? "negative" : status === "collected" ? "positive" : "primary"}
                            variant={status === "cancelled" ? "outline" : undefined}
                            disabled={busyId === order.id}
                            className={status === "ready" ? "bg-indigoscale-700" : ""}
                            onPress={() =>
                              status === "cancelled" ? setConfirmCancel(order) : changeStatus(order, status)
                            }
                          >
                            <ButtonIcon
                              as={status === "cancelled" ? XCircle : status === "collected" ? CheckCircle2 : PackageCheck}
                              className={status === "cancelled" ? "text-redscale-500" : "text-white"}
                            />
                            <ButtonText className={status === "cancelled" ? "text-redscale-500" : "text-white"}>
                              {busyId === order.id ? "Saving..." : ACTION_LABEL[status]}
                            </ButtonText>
                          </Button>
                        ))}
                      </HStack>
                    )
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <alert.AlertDialog isOpen={!!confirmCancel} onClose={() => setConfirmCancel(null)}>
        <alert.AlertDialogBackdrop />
        <alert.AlertDialogContent>
          <alert.AlertDialogHeader>
            <Heading size="md">Cancel {confirmCancel?.ticketCode}?</Heading>
          </alert.AlertDialogHeader>
          <alert.AlertDialogBody>
            <Text size="sm">
              {confirmCancel?.points} points will be returned to {confirmCancel?.userName}. This cannot be undone.
            </Text>
          </alert.AlertDialogBody>
          <alert.AlertDialogFooter>
            <Button variant="outline" action="secondary" className="mr-3" onPress={() => setConfirmCancel(null)}>
              <ButtonText>Keep order</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={() => {
                const order = confirmCancel;
                setConfirmCancel(null);
                if (order) changeStatus(order, "cancelled");
              }}
            >
              <ButtonText>Cancel & refund</ButtonText>
            </Button>
          </alert.AlertDialogFooter>
        </alert.AlertDialogContent>
      </alert.AlertDialog>
    </VStack>
  );
};

export default OrdersAdminPage;
