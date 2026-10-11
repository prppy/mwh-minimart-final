import React from "react";
import { View } from "react-native";
import { Check, Ticket } from "lucide-react-native";

import { Order } from "@/utils/types";
import {
  ORDER_STATUS_META,
  PREORDER_STEPS,
  formatSgDateTime,
  isActiveOrder,
  orderNextStep,
  preorderStepIndex,
} from "@/utils/orders";

import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const BRAND_BLUE = "#1f3a93";
const BRAND_ORANGE = "#e8502a";

export const StatusBadge: React.FC<{ order: Order }> = ({ order }) => {
  const meta = ORDER_STATUS_META[order.status];
  return (
    <View style={{ backgroundColor: meta.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: meta.fg, fontSize: 12, fontWeight: "700" }}>{meta.label}</Text>
    </View>
  );
};

/** Pre-ordered → Ready to collect → Collected */
export const PreorderTracker: React.FC<{ order: Order }> = ({ order }) => {
  const current = preorderStepIndex(order);
  const stopped = order.status === "expired" || order.status === "cancelled";

  return (
    <HStack className="items-start w-full" style={{ marginTop: 4 }}>
      {PREORDER_STEPS.map((step, index) => {
        const reached = index <= current;
        // Expired/cancelled orders keep the steps they reached, greyed out
        const color = !reached ? "#D1D5DB" : stopped ? "#9CA3AF" : BRAND_BLUE;
        return (
          <React.Fragment key={step.status}>
            <VStack className="items-center" style={{ width: 84 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: reached ? color : "#FFFFFF",
                  borderWidth: 2,
                  borderColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {reached ? (
                  <Icon as={Check} size="xs" className="text-white" />
                ) : (
                  <Text style={{ fontSize: 11, fontWeight: "700", color }}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: reached ? "700" : "500",
                  color: reached ? color : "#6B7280",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {step.label}
              </Text>
            </VStack>
            {index < PREORDER_STEPS.length - 1 && (
              <View
                style={{
                  flex: 1,
                  height: 3,
                  marginTop: 12,
                  borderRadius: 2,
                  backgroundColor: index < current ? color : "#E5E7EB",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </HStack>
  );
};

interface OrderCardProps {
  order: Order;
  /** Staff view shows the resident and hides resident-facing guidance */
  staffView?: boolean;
  actions?: React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, staffView = false, actions }) => {
  const active = isActiveOrder(order);

  return (
    <VStack
      space="sm"
      className="bg-white rounded-2xl p-4"
      style={{
        borderWidth: active ? 2 : 1,
        borderColor: active ? (order.orderType === "preorder" ? "#FDBA8C" : "#C7D2FE") : "#E5E7EB",
        borderStyle: active ? "dashed" : "solid",
      }}
    >
      <HStack className="justify-between items-start" space="sm">
        <HStack space="sm" className="items-center flex-1">
          <Icon as={Ticket} style={{ color: order.orderType === "preorder" ? BRAND_ORANGE : BRAND_BLUE }} />
          <Text bold style={{ color: BRAND_BLUE, fontSize: 18, flexShrink: 1 }}>
            {order.ticketLabel}
          </Text>
        </HStack>
        <StatusBadge order={order} />
      </HStack>

      <HStack space="sm" className="items-center" style={{ flexWrap: "wrap" }}>
        {order.orderType === "preorder" && (
          <Text style={{ fontSize: 11, fontWeight: "800", color: BRAND_ORANGE }}>PRE-ORDER</Text>
        )}
        <Text size="xs" className="text-gray-500">
          Ordered {formatSgDateTime(order.createdAt)} · {order.points} pts
        </Text>
      </HStack>

      <VStack space="xs">
        {order.items.map((item) => (
          <HStack key={item.productId} className="justify-between">
            <Text size="sm" className="text-gray-700 flex-1">
              {item.productName}
            </Text>
            <Text size="sm" className="text-gray-500">
              × {item.quantity}
            </Text>
          </HStack>
        ))}
      </VStack>

      {order.orderType === "preorder" && <PreorderTracker order={order} />}

      {!staffView && (
        <Text size="sm" style={{ color: active ? BRAND_BLUE : "#6B7280", fontWeight: active ? "700" : "500" }}>
          {orderNextStep(order)}
        </Text>
      )}
      {staffView && active && order.expiresAt && (
        <Text size="sm" className="text-gray-600">
          Expires {formatSgDateTime(order.expiresAt)}
        </Text>
      )}

      {actions}
    </VStack>
  );
};

export default OrderCard;
