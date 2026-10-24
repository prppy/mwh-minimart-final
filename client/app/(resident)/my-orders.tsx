import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, useWindowDimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";

import api from "@/utils/api";
import { Order } from "@/utils/types";
import { isActiveOrder } from "@/utils/orders";
import { useAuth } from "@/contexts/auth-context";

import OrderCard from "@/components/order-card";
import Spinner from "@/components/custom-spinner";
import { Button, ButtonIcon, ButtonText } from "@/components/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const MOBILE_BREAKPOINT = 768;
const AUTO_REFRESH_MS = 30 * 1000;

const MyOrdersPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("orders/my");
      setOrders(res.data.data || []);
    } catch (err: any) {
      // Keep whatever was loaded last; with nothing loaded the page shows
      // the "no orders" message rather than an error
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh when the page is opened, and every 30 s while it is visible so
  // residents see "Ready to collect" without reloading
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      fetchOrders();
      const timer = setInterval(fetchOrders, AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [isAuthenticated, fetchOrders])
  );

  if (!isAuthenticated || !user) {
    return (
      <VStack className="flex-1 justify-center items-center bg-indigoscale-100 p-6" space="md">
        <Text>Please log in to see your orders.</Text>
        <Button className="bg-indigoscale-700" onPress={() => router.push("/login")}>
          <ButtonText className="text-white">Log in</ButtonText>
        </Button>
      </VStack>
    );
  }

  const active = orders.filter(isActiveOrder);
  const past = orders.filter((o) => !isActiveOrder(o));

  return (
    <ScrollView
      className="flex-1 bg-indigoscale-100"
      contentContainerStyle={{ padding: isMobile ? 12 : 24, alignItems: "center" }}
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
      <VStack space="lg" style={{ width: "100%", maxWidth: 760 }}>
        <VStack space="xs">
          <Heading size="2xl" style={{ color: "#1f3a93" }}>
            My Orders
          </Heading>
          <Text className="text-gray-600">
            Show your ticket at the minimart counter to collect your items.
          </Text>
        </VStack>

        {loading ? (
          <Spinner text="Loading your orders..." />
        ) : orders.length === 0 ? (
          <VStack space="md" className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-gray-600">You have no orders at the moment.</Text>
            <Button className="bg-indigoscale-700" onPress={() => router.push("/(public)/catalogue")}>
              <ButtonIcon as={ShoppingBag} className="text-white" />
              <ButtonText className="text-white">Browse the catalogue</ButtonText>
            </Button>
          </VStack>
        ) : (
          <>
            <VStack space="sm">
              <Heading size="md" className="text-indigoscale-900">
                Active ({active.length})
              </Heading>
              {active.length === 0 ? (
                <Text className="text-gray-500">No tickets waiting for collection.</Text>
              ) : (
                active.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </VStack>

            {past.length > 0 && (
              <VStack space="sm">
                <Heading size="md" className="text-indigoscale-900">
                  Past orders
                </Heading>
                {past.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </VStack>
            )}
          </>
        )}
      </VStack>
    </ScrollView>
  );
};

export default MyOrdersPage;
