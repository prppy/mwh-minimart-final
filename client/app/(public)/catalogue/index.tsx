import { useEffect, useState, useMemo } from "react";
import { useRouter, useNavigation } from "expo-router";
import { ShoppingCart, Plus, Minus } from "lucide-react-native";
import { Pressable } from "react-native";

import api from "@/utils/api";
import { Category, Product } from "@/utils/types";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

import Checkbox from "@/components/custom-checkbox";
import SearchableGrid from "@/components/custom-searchable-grid";
import Spinner from "@/components/custom-spinner";
import CartModal from "@/components/cart-modal";

import { HStack } from "@/components/ui/hstack";
import * as slider from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";

const CataloguePage: React.FC = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { cart, cartCount, totalPoints, removeFromCart, updateQuantity } = useCart();
  const { role } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Daily", "Showcase"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [points, setPoints] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  // Announcement Banner States
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [showDealsBanner, setShowDealsBanner] = useState(false);
  const [showRestockedBanner, setShowRestockedBanner] = useState(false);
  const [newestItemName, setNewestItemName] = useState<string>("");

  const isResident = role === "resident";

  // Helper classification functions for client-side Type filtering
  const isShowcase = (product: Product) => {
    if (product.MWH_Type) {
      return product.MWH_Type.Type_Name === "Showcase" || product.MWH_Type.Type_ID === 2;
    }
    if (product.Type_ID !== undefined && product.Type_ID !== null) {
      return Number(product.Type_ID) === 2;
    }
    const catName = product.category?.categoryName || "";
    return ["Apparels", "Accessories", "Electronics"].includes(catName);
  };

  const isDaily = (product: Product) => {
    if (product.MWH_Type) {
      return product.MWH_Type.Type_Name === "Daily" || product.MWH_Type.Type_ID === 1;
    }
    if (product.Type_ID !== undefined && product.Type_ID !== null) {
      return Number(product.Type_ID) === 1;
    }
    return !isShowcase(product);
  };

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        api.get("categories"),
        api.get("products"),
      ]);
      const fetchedCats = categoriesRes.data.data || [];
      setCategories(fetchedCats);
      if (isInitial) {
        setSelectedCategories(fetchedCats.map((c: any) => c.id.toString()));
      }

      let fetchedProducts: Product[] = [];
      const resData = productsRes.data.data;
      if (Array.isArray(resData)) {
        fetchedProducts = resData;
      } else if (Array.isArray(resData?.products)) {
        fetchedProducts = resData.products;
      } else {
        console.warn("Unexpected response:", productsRes.data);
      }

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const unsubscribe = navigation.addListener("focus", () => {
      fetchData(false);
    });

    // Supabase Realtime Subscription for MWH_Product
    const channelId = `catalogue-realtime-${Math.random().toString(36).substring(2, 11)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "MWH_Product" },
        (payload) => {
          console.log("Realtime product update received:", payload);
          // Refetch to sync complete details (including category, types relations)
          fetchData(false);

          // Reactivate banners dynamically depending on the event type
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;
            const prodName = newRow.Product_Name ?? newRow.productName;
            if (prodName) {
              setNewestItemName(prodName);
            }
            setShowNewBanner(true);
          } else if (payload.eventType === "UPDATE") {
            const oldRow = payload.old as any;
            const newRow = payload.new as any;

            const isNewAvailable = newRow.Available ?? newRow.available;
            const isOldAvailable = oldRow ? (oldRow.Available ?? oldRow.available) : undefined;

            if (isNewAvailable && !isOldAvailable) {
              setShowRestockedBanner(true);
            }

            const newCatId = newRow.Category_ID ?? newRow.categoryId;
            const oldCatId = oldRow ? (oldRow.Category_ID ?? oldRow.categoryId) : undefined;
            if (newCatId !== oldCatId) {
              setShowDealsBanner(true);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Supabase Realtime subscription status:", status);
      });

    return () => {
      unsubscribe();
      console.log("Cleaning up Supabase Realtime channel...");
      supabase.removeChannel(channel);
    };
  }, [navigation]);

  useEffect(() => {
    if (showNewBanner) {
      const timer = setTimeout(() => setShowNewBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showNewBanner]);

  useEffect(() => {
    if (showDealsBanner) {
      const timer = setTimeout(() => setShowDealsBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showDealsBanner]);

  useEffect(() => {
    if (showRestockedBanner) {
      const timer = setTimeout(() => setShowRestockedBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showRestockedBanner]);

  // Sidebar category order Drinks → Food → Personal Care → Apparels → Accessories → Electronics → Weekly Deals
  const categoryOrder = [
    "Drinks",
    "Food",
    "Personal Care",
    "Apparels",
    "Accessories",
    "Electronics",
    "Weekly Deals"
  ];

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const nameA = a.categoryName || "";
      const nameB = b.categoryName || "";
      const indexA = categoryOrder.indexOf(nameA);
      const indexB = categoryOrder.indexOf(nameB);

      if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [categories]);

  // Robust client-side filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Points filter
      if (product.points !== undefined && product.points !== null) {
        if (product.points > points) return false;
      }

      // 2. Category filter
      if (selectedCategories.length > 0) {
        const prodCatId = product.categoryId?.toString();
        if (!prodCatId || !selectedCategories.includes(prodCatId)) {
          return false;
        }
      }

      // 3. Type filter
      if (selectedTypes.length > 0) {
        const matchesDaily = selectedTypes.includes("Daily") && isDaily(product);
        const matchesShowcase = selectedTypes.includes("Showcase") && isShowcase(product);
        if (!matchesDaily && !matchesShowcase) return false;
      }

      return true;
    });
  }, [products, points, selectedCategories, selectedTypes]);

  // Announcement Banner calculations
  const newItems = useMemo(() => {
    if (newestItemName) return newestItemName;
    const sorted = [...products].sort((a, b) => Number(b.id) - Number(a.id));
    return sorted[0]?.productName || "";
  }, [products, newestItemName]);

  const hasWeeklyDeals = useMemo(() => {
    return products.some((p) => p.category?.categoryName === "Weekly Deals");
  }, [products]);

  const availableCount = useMemo(() => {
    return products.filter((p) => p.available).length;
  }, [products]);

  return (
    <HStack className="flex-1 gap-5 p-5 pb-5 bg-indigoscale-100 items-stretch">
      <VStack
        className="w-1/4 self-start p-5 bg-white border border-gray-300 rounded-lg"
        space="xl"
      >
        {/* View Cart Button - Only for residents */}
        {isResident && cartCount > 0 && (
          <Button
            size="lg"
            onPress={() => setShowCart(true)}
            className="bg-indigoscale-700 relative"
          >
            <ButtonIcon as={ShoppingCart} className="text-white" />
            <ButtonText className="text-white font-bold">
              View Cart ({cartCount})
            </ButtonText>

          </Button>
        )}

        {isResident && cartCount > 0 && (
          <VStack className="p-3 bg-indigoscale-50 rounded-lg" space="sm">
            <Text className="text-indigoscale-700 font-semibold">
              Cart Summary
            </Text>

            {/* Per-item breakdown */}
            {cart.map((item) => (
              <HStack key={item.id} className="items-center" space="xs">
                <Text className="text-sm font-semibold text-indigoscale-700 flex-1" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Button
                  size="xs"
                  action="secondary"
                  className="w-6 h-6 rounded-full bg-indigoscale-100 p-0"
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <ButtonIcon as={Minus} className="text-indigoscale-700" size="xs" />
                </Button>
                <Text className="text-sm font-semibold w-4 text-center">
                  {item.quantity}
                </Text>
                <Button
                  size="xs"
                  action="secondary"
                  className="w-6 h-6 rounded-full bg-indigoscale-100 p-0"
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <ButtonIcon as={Plus} className="text-indigoscale-700" size="xs" />
                </Button>
                <Text className="text-xs text-gray-500 w-16 text-right">
                  {item.points * item.quantity} pts
                </Text>
              </HStack>
            ))}

            {/* Total */}
            <HStack className="justify-between border-t border-indigoscale-200 pt-2 mt-1">
              <Text className="text-sm font-semibold">Total:</Text>
              <Text className="text-sm font-semibold text-indigoscale-700">
                {totalPoints} pts
              </Text>
            </HStack>
          </VStack>
        )}

        {/* category filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700 font-semibold" size={"lg"}>
            Category
          </Text>
          <VStack space="sm">
            {sortedCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id.toString());
              return (
                <Checkbox
                  key={category.id}
                  value={category.id.toString()}
                  isChecked={isSelected}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedCategories((prev) => [...prev, category.id.toString()]);
                    } else {
                      setSelectedCategories((prev) =>
                        prev.filter((id) => id !== category.id.toString())
                      );
                    }
                  }}
                >
                  {category.categoryName}
                </Checkbox>
              );
            })}
          </VStack>
        </VStack>

        {/* type filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700 font-semibold" size={"lg"}>
            Type
          </Text>
          <VStack space="sm">
            <Checkbox
              value="Daily"
              isChecked={selectedTypes.includes("Daily")}
              onChange={(checked) => {
                if (checked) {
                  setSelectedTypes((prev) => [...prev, "Daily"]);
                } else {
                  setSelectedTypes((prev) => prev.filter((t) => t !== "Daily"));
                }
              }}
            >
              Daily
            </Checkbox>
            <Checkbox
              value="Showcase"
              isChecked={selectedTypes.includes("Showcase")}
              onChange={(checked) => {
                if (checked) {
                  setSelectedTypes((prev) => [...prev, "Showcase"]);
                } else {
                  setSelectedTypes((prev) => prev.filter((t) => t !== "Showcase"));
                }
              }}
            >
              Showcase
            </Checkbox>
          </VStack>
        </VStack>

        {/* points filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700 font-semibold" size={"lg"}>
            Points (0 - {points.toLocaleString()})
          </Text>
          <slider.Slider
            minValue={0}
            maxValue={50000}
            step={50}
            defaultValue={50000}
            onChange={(val) => {
              const numVal = Array.isArray(val) ? val[0] : val;
              setPoints(numVal || 0);
            }}
          >
            <slider.SliderTrack>
              <slider.SliderFilledTrack
                className="
                bg-indigoscale-500 rounded-full
                data-[active=true]:bg-indigoscale-500
                data-[hover=true]:bg-indigoscale-500
              "
              />
            </slider.SliderTrack>
            <slider.SliderThumb
              className="
                w-5 h-5 rounded-full shadow
                bg-indigoscale-700
                data-[active=true]:bg-indigoscale-700
                data-[hover=true]:bg-indigoscale-700
              "
            />
          </slider.Slider>
        </VStack>
      </VStack>

      {/* products grid & announcements */}
      <VStack className="flex-1" space="md">
        {/* Announcement Banners */}
        <VStack space="sm" className="mb-2">
          {showNewBanner && newItems.length > 0 && (
            <HStack className="justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Text className="text-blue-800 text-sm font-semibold flex-1">
                🆕 New Item Added: {newItems}
              </Text>
              <Pressable onPress={() => setShowNewBanner(false)}>
                <Text className="text-blue-500 font-bold ml-3 px-1 text-sm">✕</Text>
              </Pressable>
            </HStack>
          )}

          {showDealsBanner && hasWeeklyDeals && (
            <HStack className="justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
              <Text className="text-orange-800 text-sm font-semibold flex-1">
                🔥 Weekly Deals available now! Check out our special offers.
              </Text>
              <Pressable onPress={() => setShowDealsBanner(false)}>
                <Text className="text-orange-500 font-bold ml-3 px-1 text-sm">✕</Text>
              </Pressable>
            </HStack>
          )}

          {showRestockedBanner && availableCount > 0 && (
            <HStack className="justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
              <Text className="text-green-800 text-sm font-semibold flex-1">
                📦 We are fully restocked! {availableCount} items are ready for redemption.
              </Text>
              <Pressable onPress={() => setShowRestockedBanner(false)}>
                <Text className="text-green-500 font-bold ml-3 px-1 text-sm">✕</Text>
              </Pressable>
            </HStack>
          )}
        </VStack>

        {loading ? (
          <Spinner text="Loading products..." />
        ) : (
          <SearchableGrid
            items={filteredProducts.map((product) => ({
              id: product.id,
              name: product.productName,
              points: product.points,
              image: product.imageUrl,
              redemptionCount: product.redemptionCount || 0,
            }))}
            onItemPress={(item) => router.push(`/catalogue/${item.id}`)}
            onAddPress={() => router.push(`/catalogue/0`)}
            noItemsAlert="No products found!"
            enableCart={true}
            categoryId={selectedCategories[0] || "all"}
          />
        )}
      </VStack>

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onOpenCart={() => setShowCart(true)}
      />
    </HStack>
  );
};

export default CataloguePage;
