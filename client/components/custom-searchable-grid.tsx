import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions } from "react-native";
import { Plus, ShoppingCart } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import DropdownSelect from "./dropdown-select";
import EmptyAlert from "./custom-empty-alert";
import SearchBar from "./custom-searchbar";

import { Button, ButtonText, ButtonIcon } from "@/components/button";
import { Card } from "./ui/card";
import { Center } from "./ui/center";
import { Grid, GridItem } from "./ui/grid";
import { HStack } from "./ui/hstack";
import { Icon } from "./ui/icon";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";

type SortOption = "low-to-high" | "high-to-low" | "latest" | "sales" | "custom";

export interface GridTier {
  id: number;
  label: string;
  points: number;
  maxPerOrder?: number | null;
  isPreorder?: boolean;
}

export interface GridItemData {
  id: number | string;
  name: string;
  points: number; // lowest tier's points when tiered
  image: string;
  redemptionCount?: number;
  maxPerOrder?: number | null;
  isPreorder?: boolean;
  tiers?: GridTier[]; // sorted by points; present when the item has more than one tier
}

interface SearchableGridProps {
  items: GridItemData[];
  onItemPress: (item: GridItemData) => void;
  onAddPress: () => void;
  noItemsAlert: string;
  enableCart?: boolean;
  categoryId?: number | string;
}

const MOBILE_BREAKPOINT = 768;

const SearchableGrid: React.FC<SearchableGridProps> = ({
  items,
  onItemPress,
  onAddPress,
  noItemsAlert,
  enableCart = false,
  categoryId = "all",
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const { isAdmin, isAuthenticated, role } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [sortOption, setSortOption] = useState<SortOption>("custom");
  const [search, setSearch] = useState("");
  // Selected tier per tiered item (item id -> tier product id); defaults to the cheapest tier
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});

  // Reorder mode states
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<typeof items>([]);
  const [customOrder, setCustomOrder] = useState<(string | number)[]>([]);

  const showCart = enableCart && role === "resident";

  const storageKey = useMemo(() => {
    return `@mwh_product_order_${categoryId}`;
  }, [categoryId]);

  // Load custom order from AsyncStorage
  useEffect(() => {
    const loadOrder = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomOrder(parsed);
          }
        } else {
          setCustomOrder([]);
        }
      } catch (e) {
        console.error("Error loading product order:", e);
      }
    };
    loadOrder();
  }, [storageKey]);

  /** The purchasable product for a card: the selected tier, or the item itself */
  const getSelection = (item: GridItemData) => {
    const tier =
      item.tiers?.find((t) => t.id === selectedTiers[String(item.id)]) ??
      item.tiers?.[0];
    if (tier) {
      return {
        id: tier.id,
        productName: `${item.name} – ${tier.label}`,
        tierLabel: tier.label,
        points: tier.points,
        maxPerOrder: tier.maxPerOrder,
        isPreorder: tier.isPreorder,
      };
    }
    return {
      id: Number(item.id),
      productName: item.name,
      tierLabel: null,
      points: item.points,
      maxPerOrder: item.maxPerOrder,
      isPreorder: item.isPreorder,
    };
  };

  const handleAddToCart = (e: any, item: GridItemData) => {
    e.stopPropagation(); // Prevent card click
    addToCart({ ...getSelection(item), imageUrl: item.image });
  };

  const handleSortPress = (val: SortOption) => {
    if (sortOption === val) {
      setSortOption("custom"); // Deselect back to custom order
    } else {
      setSortOption(val);
    }
  };

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortOption === "custom") {
      return [...filtered].sort((a, b) => {
        const indexA = customOrder.indexOf(a.id);
        const indexB = customOrder.indexOf(b.id);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    switch (sortOption) {
      case "low-to-high":
        return [...filtered].sort((a, b) => a.points - b.points);
      case "high-to-low":
        return [...filtered].sort((a, b) => b.points - a.points);
      case "latest":
        return [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
      case "sales":
        return [...filtered].sort(
          (a, b) => (b.redemptionCount || 0) - (a.redemptionCount || 0)
        );
      default:
        return filtered;
    }
  }, [items, search, sortOption, customOrder]);

  // Reorder mode handlers
  const handleStartReorder = () => {
    // Current items sorted in custom order
    const sorted = [...items].sort((a, b) => {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    setOrderedItems(sorted);
    setIsReorderMode(true);
    setSortOption("custom");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setOrderedItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedItems.length - 1) return;
    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setOrderedItems(newItems);
  };

  const handleSaveOrder = async () => {
    try {
      const newOrder = orderedItems.map((item) => item.id);
      setCustomOrder(newOrder);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newOrder));
      setIsReorderMode(false);
    } catch (e) {
      console.error("Error saving product order:", e);
    }
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
  };

  const sortButtons: { value: SortOption; label: string }[] = [
    { value: "low-to-high", label: "Low to High" },
    { value: "high-to-low", label: "High to Low" },
    { value: "latest", label: "Latest" },
    { value: "sales", label: "Sales" },
  ];

  const displayItems = isReorderMode ? orderedItems : sortedAndFilteredItems;

  return (
    <VStack className="flex-1 gap-5" space="md">
      <HStack className="w-full justify-between gap-3 items-center" style={{ flexWrap: 'wrap' }}>
        {/* search bar */}
        <SearchBar search={search} setSearch={setSearch} />

        {/* sort buttons - hidden on mobile */}
        {!isMobile && !isReorderMode &&
          sortButtons.map((btn) => (
            <Button
              key={btn.value}
              action="secondary"
              className={sortOption === btn.value ? "bg-indigoscale-700" : ""}
              onPress={() => handleSortPress(btn.value)}
            >
              <ButtonText
                className={
                  sortOption === btn.value
                    ? "text-white font-semibold"
                    : "text-indigoscale-700 font-semibold"
                }
              >
                {btn.label}
              </ButtonText>
            </Button>
          ))}
      </HStack>



      {/* grid */}
      {displayItems.length === 0 ? (
        <EmptyAlert text={noItemsAlert} />
      ) : (
        <VStack className="flex-1 overflow-hidden">
          <ScrollView>
            <Grid className="gap-5" _extra={{ className: isMobile ? "grid-cols-1" : "grid-cols-2" }}>
              {isAuthenticated && isAdmin && !isReorderMode && (
                <GridItem _extra={{ className: "col-span-1" }}>
                  <Pressable onPress={onAddPress}>
                    <Card className="bg-white" size="md" variant="outline">
                      <Center className={`w-full ${isMobile ? 'h-40' : 'h-64'} bg-indigoscale-300 rounded-md mb-5`}>
                        <Icon
                          as={Plus}
                          size={64}
                          className="text-indigoscale-700"
                        />
                      </Center>
                      <Text size="xl" className="text-indigoscale-700">
                        Add New Item
                      </Text>
                    </Card>
                  </Pressable>
                </GridItem>
              )}
              {displayItems.map((item) => {
                const selection = getSelection(item);
                const inCart = isInCart(selection.id);
                return (
                <GridItem key={item.id} _extra={{ className: "col-span-1" }}>
                  <Card className="bg-white" size="md" variant="outline">
                    <Pressable onPress={() => !isReorderMode && onItemPress(item)}>
                      <Center className={`w-full ${isMobile ? 'h-40' : 'h-64'} bg-indigoscale-300 rounded-md mb-5`}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            alt={item.name}
                            className="w-full h-full"
                            resizeMode="contain"
                          />
                        ) : null}
                      </Center>
                    </Pressable>
                    <VStack space="xs">
                      <Text size="xl" className="text-indigoscale-700" bold>
                        {item.name}
                      </Text>
                      <Text bold className="text-gray-500">
                        {selection.points} pts
                      </Text>
                      {item.tiers && item.tiers.length > 1 && (
                        <DropdownSelect
                          compact
                          accessibilityLabel={`${item.name} size`}
                          value={String(selection.id)}
                          onChange={(value) =>
                            setSelectedTiers((prev) => ({
                              ...prev,
                              [String(item.id)]: Number(value),
                            }))
                          }
                          options={item.tiers.map((tier) => ({
                            label: `${tier.label} · ${tier.points} pts`,
                            value: String(tier.id),
                          }))}
                        />
                      )}
                      {(!!selection.isPreorder || !!selection.maxPerOrder) && (
                        <HStack space="sm">
                          {!!selection.isPreorder && (
                            <Text size="sm" bold className="text-orangescale-700">
                              Pre-order
                            </Text>
                          )}
                          {!!selection.maxPerOrder && (
                            <Text size="sm" className="text-gray-500">
                              Max {selection.maxPerOrder} per order
                            </Text>
                          )}
                        </HStack>
                      )}
                      {sortOption === "sales" && !isReorderMode && (
                        <Text className="text-xs text-gray-400">
                          {item.redemptionCount || 0} sold
                        </Text>
                      )}
                      {showCart && !isReorderMode && (
                        <Button
                          size="sm"
                          onPress={(e) => handleAddToCart(e, item)}
                          className={
                            inCart
                              ? "bg-green-600"
                              : "bg-indigoscale-700"
                          }
                        >
                          <ButtonIcon as={ShoppingCart} className="text-white" />
                          <ButtonText className="text-white">
                            {inCart ? "In Cart" : "Add to Cart"}
                          </ButtonText>
                        </Button>
                      )}


                    </VStack>
                  </Card>
                </GridItem>
                );
              })}
              {/* filler if odd to prevent weird ui */}
              {(displayItems.length + (isAuthenticated && isAdmin && !isReorderMode ? 1 : 0)) %
                2 !==
                0 && <GridItem _extra={{ className: "col-span-1" }}></GridItem>}
            </Grid>
          </ScrollView>
        </VStack>
      )}
    </VStack>
  );
};

export default SearchableGrid;
