import { useState } from "react";
import { TouchableOpacity, Platform } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { updateRequestStatus } from "@/utils/api/productRequests";
import { AVATAR_PALETTE } from "@/utils/types/feedback";
import {
  REQUEST_STATUS_STYLES,
  REQUEST_STATUS_OPTIONS,
  type ProductRequestItem,
  type RequestStatus,
} from "@/utils/types/productRequest";

interface ProductRequestCardProps {
  item:           ProductRequestItem;
  onStatusChange: () => void;
}

export const ProductRequestCard: React.FC<ProductRequestCardProps> = ({ item, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const name     = item.residentName ?? "?";
  const initials = name.trim().length > 0
    ? name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatarStyle = AVATAR_PALETTE[item.requestId % AVATAR_PALETTE.length];
  const statusStyle = REQUEST_STATUS_STYLES[item.requestStatus] ?? { bg: "#F1EFE8", text: "#5F5E5A" };

  async function handleStatusChange(status: RequestStatus) {
    if (status === item.requestStatus) return;
    setLoading(true);
    try {
      await updateRequestStatus(item.requestId, status);
      onStatusChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack
      className="bg-white rounded-xl p-3 mb-2 gap-2"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      {/* Top row: avatar + name + date + status */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-2">
          <VStack
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: avatarStyle.bg }}
          >
            <Text style={{ fontSize: 10, fontWeight: 700, color: avatarStyle.text }}>
              {initials}
            </Text>
          </VStack>
          <VStack>
            <Text className="text-xs font-medium text-typography-800">{name}</Text>
            <Text style={{ fontSize: 10, color: "#B4B2A9" }}>{item.submittedAt}</Text>
          </VStack>
        </HStack>

        {/* Status — native select on web, touchable on native */}
        {Platform.OS === "web" ? (
          <select
            value={item.requestStatus}
            disabled={loading}
            onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
            style={{
              backgroundColor: statusStyle.bg,
              color:           statusStyle.text,
              border:          "none",
              borderRadius:    6,
              padding:         "2px 6px",
              fontSize:        10,
              fontWeight:      600,
              cursor:          "pointer",
              opacity:         loading ? 0.6 : 1,
            }}
          >
            {REQUEST_STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          // Mobile fallback — you can implement a modal picker here later
          <VStack
            className="px-2 py-0.5 rounded-md flex-row items-center gap-1"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: statusStyle.text }}>
              {REQUEST_STATUS_OPTIONS.find((o) => o.value === item.requestStatus)?.label ?? item.requestStatus}
            </Text>
            <Icon as={ChevronDown} size="2xs" style={{ color: statusStyle.text }} />
          </VStack>
        )}
      </HStack>

      {/* Product name */}
      <Text className="text-xs font-semibold text-typography-800">
        {item.productName}
      </Text>

      {/* Description */}
      {item.description && (
        <Text className="text-xs text-typography-600" style={{ lineHeight: 18 }}>
          {item.description}
        </Text>
      )}

      {/* Category badge */}
      {item.requestCategory && (
        <HStack>
          <VStack
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "#F1EFE8" }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#5F5E5A" }}>
              {item.requestCategory.charAt(0).toUpperCase() + item.requestCategory.slice(1)}
            </Text>
          </VStack>
        </HStack>
      )}
    </VStack>
  );
};