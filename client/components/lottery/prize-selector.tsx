import React from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { Search, X, Gift, Check } from "lucide-react-native";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Image as UiImage } from "@/components/ui/image";
import { Product } from "@/utils/types";

const MOBILE_BREAKPOINT = 768;

interface PrizeSelectorProps {
  products: Product[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  itemSearch: string;
  onSearchChange: (text: string) => void;
}

const PrizeSelector: React.FC<PrizeSelectorProps> = ({
  products,
  selectedItemId,
  onSelectItem,
  itemSearch,
  onSearchChange,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const selectedProduct = products.find((p) => String(p.id) === selectedItemId);

  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: isMobile ? 14 : 20,
        gap: 16,
      }}
    >
      {/* Header */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-3">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#EEF2FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon as={Gift} size="md" style={{ color: "#6366F1" }} />
          </View>
          <VStack>
            <Heading size="md" style={{ color: "#1F2937" }}>
              Select Prize
            </Heading>
            {selectedProduct ? (
              <Text style={{ fontSize: 13, color: "#6366F1", fontWeight: "600" }}>
                {selectedProduct.productName} — {selectedProduct.points} pts
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                Tap an item below to select
              </Text>
            )}
          </VStack>
        </HStack>
      </HStack>

      {/* Search */}
      <Input
        variant="outline"
        size="md"
        style={{ borderRadius: 12, borderColor: "#E5E7EB" }}
      >
        <InputSlot className="pl-3">
          <InputIcon as={Search} style={{ color: "#9CA3AF" }} />
        </InputSlot>
        <InputField
          placeholder="Search items..."
          value={itemSearch}
          onChangeText={onSearchChange}
          style={{ color: "#374151" }}
        />
        {itemSearch.length > 0 && (
          <InputSlot className="pr-3">
            <Pressable onPress={() => onSearchChange("")}>
              <InputIcon as={X} style={{ color: "#9CA3AF" }} />
            </Pressable>
          </InputSlot>
        )}
      </Input>

      {/* Product grid */}
      {products.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 32 }}>
          <Icon as={Gift} size="xl" style={{ color: "#D1D5DB", marginBottom: 8 }} />
          <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
            No showcase items available
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 4 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {products.map((product) => {
              const isSelected = selectedItemId === String(product.id);
              return (
                <Pressable
                  key={product.id}
                  onPress={() =>
                    onSelectItem(isSelected ? "" : String(product.id))
                  }
                  style={{
                    width: isMobile ? "47%" : 140,
                    borderRadius: 14,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: isSelected ? "#6366F1" : "#F3F4F6",
                    backgroundColor: isSelected ? "#EEF2FF" : "#FAFAFA",
                  }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: "#6366F1",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                  <UiImage
                    source={product.imageUrl}
                    alt={product.productName}
                    style={{ width: "100%", height: isMobile ? 100 : 110 }}
                    resizeMode="cover"
                  />
                  <VStack style={{ padding: 10, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#374151",
                      }}
                      numberOfLines={2}
                    >
                      {product.productName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isSelected ? "#6366F1" : "#9CA3AF",
                      }}
                    >
                      {product.points} pts
                    </Text>
                  </VStack>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </VStack>
  );
};

export default PrizeSelector;
