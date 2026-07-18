import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Check, Ban } from "lucide-react-native";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Resident } from "@/utils/types";

// Colour lookup map for wallpaperType → style values
const WALLPAPER_COLOURS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  indigo:  { bg: "#C7D2FE", border: "#6366F1", text: "#3730A3", light: "#EEF2FF" },
  red:     { bg: "#FECACA", border: "#EF4444", text: "#991B1B", light: "#FEF2F2" },
  orange:  { bg: "#FED7AA", border: "#F97316", text: "#9A3412", light: "#FFF7ED" },
  green:   { bg: "#BBF7D0", border: "#22C55E", text: "#166534", light: "#F0FDF4" },
  blue:    { bg: "#BFDBFE", border: "#3B82F6", text: "#1E40AF", light: "#EFF6FF" },
  purple:  { bg: "#DDD6FE", border: "#8B5CF6", text: "#5B21B6", light: "#F5F3FF" },
  pink:    { bg: "#FBCFE8", border: "#EC4899", text: "#9D174D", light: "#FDF2F8" },
  yellow:  { bg: "#FEF08A", border: "#EAB308", text: "#854D0E", light: "#FEFCE8" },
};

const DEFAULT_COLOUR = { bg: "#E0E7FF", border: "#6366F1", text: "#3730A3", light: "#EEF2FF" };

interface ResidentCardProps {
  resident: Resident;
  isSelected: boolean;
  isEligible: boolean;
  onToggle: (id: string) => void;
}

const ResidentCard: React.FC<ResidentCardProps> = ({
  resident,
  isSelected,
  isEligible,
  onToggle,
}) => {
  const colours = WALLPAPER_COLOURS[resident.wallpaperType || "indigo"] || DEFAULT_COLOUR;

  return (
    <Pressable
      onPress={() => isEligible && onToggle(resident.id.toString())}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: isSelected ? colours.border : isEligible ? "#E5E7EB" : "#F3F4F6",
        backgroundColor: isSelected ? colours.light : isEligible ? "#FFFFFF" : "#F9FAFB",
        opacity: isEligible ? 1 : 0.5,
      }}
    >
      {/* Checkbox */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: isSelected ? colours.border : "#D1D5DB",
          backgroundColor: isSelected ? colours.border : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isSelected && <Icon as={Check} size="xs" className="text-white" />}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 15,
            color: isEligible ? colours.text : "#9CA3AF",
          }}
        >
          {resident.userName}
        </Text>
        <HStack className="items-center gap-2" style={{ marginTop: 2 }}>
          <Text style={{ fontSize: 12, color: isEligible ? "#6B7280" : "#9CA3AF" }}>
            {resident.currentPoints ?? 0} pts
          </Text>
          {resident.batchNumber && (
            <>
              <Text style={{ fontSize: 12, color: "#D1D5DB" }}>•</Text>
              <Text style={{ fontSize: 12, color: isEligible ? "#6B7280" : "#9CA3AF" }}>
                Batch {resident.batchNumber}
              </Text>
            </>
          )}
        </HStack>
      </View>

      {/* Ineligible badge */}
      {!isEligible && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#FEF2F2",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Icon as={Ban} size="xs" style={{ color: "#EF4444" }} />
          <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>
            Insufficient
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default ResidentCard;
