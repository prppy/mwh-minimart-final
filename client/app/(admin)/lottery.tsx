import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Search, X } from "lucide-react-native";

import api from "@/utils/api";
import { Product, Resident, WheelParticipant } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import FortuneWheel from "@/components/custom-fortune-wheel";
import CustomSpinner from "@/components/custom-spinner";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import Checkbox from "@/components/custom-checkbox";
import { Center } from "@/components/ui/center";
import * as alert from "@/components/ui/alert-dialog";

type RedemptionStatus = "idle" | "loading" | "success" | "error";

const LotteryPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState("");
  const [redemptionStatus, setRedemptionStatus] = useState<RedemptionStatus>("idle");
  const [redemptionError, setRedemptionError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => products.find((p) => String(p.id) === selectedItemId) ?? null,
    [products, selectedItemId]
  );

  // Only show Showcase items (Type_ID = 2), filtered by search
  const showcaseProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.typeId === 2 &&
          p.productName.toLowerCase().includes(itemSearch.toLowerCase())
      ),
    [products, itemSearch]
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("products");
        const data = response.data.data;
        const fetched: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setProducts(fetched);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    const fetchResidents = async () => {
      setLoading(true);
      try {
        const usersResponse = await api.get(
          "users?role=resident&includeProfilePicture=false"
        );
        let fetchedResidents = usersResponse.data.data.users ?? [];

        const parsedResidents: Resident[] = fetchedResidents
          .filter((u: any) => u.userRole === "resident" && u.resident)
          .map((u: any) => ({
            id: u.id,
            userId: u.resident.userId,
            userName: u.userName,
            userRole: "resident",
            profilePicture: u.profilePicture ?? null,

            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),

            batchNumber: u.resident.batchNumber,
            currentPoints: u.resident.currentPoints,
            totalPoints: u.resident.totalPoints,

            dateOfAdmission: new Date(u.resident.dateOfAdmission),
            dateOfBirth: new Date(u.resident.dateOfBirth),
            lastAbscondence: u.resident.lastAbscondence ?? null,

            backgroundType: u.resident.backgroundType,
            wallpaperType: u.resident.wallpaperType,
          }));

        setResidents(parsedResidents);
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchResidents();
  }, []);

  // When selected item changes, drop any selected residents who can't afford it
  useEffect(() => {
    if (!selectedItem) return;
    setSelectedResidents((prev) =>
      prev.filter((id) => {
        const res = residents.find((r) => String(r.id) === id);
        return res && (res.currentPoints ?? 0) >= selectedItem.points;
      })
    );
  }, [selectedItem, residents]);

  const userMap = useMemo(() => {
    const map = new Map<string, Resident>();
    residents.forEach((res) => {
      map.set(String(res.id), res);
    });
    return map;
  }, [residents]);

  const filteredResidents = useMemo(() => {
    return residents.filter((res) =>
      res.userName.toLowerCase().includes(search.toLowerCase())
    );
  }, [residents, search]);

  const wheelParticipants = useMemo<WheelParticipant[]>(() => {
    return Array.from(selectedResidents).map((userId) => {
      const user = userMap.get(userId);
      return {
        id: String(user?.id ?? ""),
        name: user?.userName || "Unknown",
        ...(user?.profilePicture
          ? { profilePicture: user.profilePicture }
          : {}),
      };
    });
  }, [selectedResidents, userMap]);

  // wheel configurations
  const generateWheelColors = (count: number): string[] => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  const wheelOptions = wheelParticipants.map((p) => p.name);
  const wheelColors = generateWheelColors(wheelParticipants.length);

  const handleSelectAll = () => {
    // Only select residents who can afford the selected item (if any)
    const eligible = residents.filter(
      (res) =>
        !selectedItem || (res.currentPoints ?? 0) >= selectedItem.points
    );
    setSelectedResidents(eligible.map((res) => res.id.toString()));
  };

  const handleDeselectAll = () => {
    setSelectedResidents([]);
  };

  const handleSpin = () => {
    if (wheelParticipants.length < 1) {
      setWinner("Error: Please select at least 1 participant");
      return;
    }
    setSpinning(true);
  };

  const handleSpinEnd = (winnerName: string) => {
    setSpinning(false);
    setTimeout(async () => {
      setWinner(winnerName);

      // Remove winner from selected residents to prevent winning again
      const winnerParticipant = wheelParticipants.find(
        (p) => p.name === winnerName
      );
      if (winnerParticipant) {
        setSelectedResidents((prev) =>
          prev.filter((id) => id !== winnerParticipant.id)
        );

        // Auto-redeem the selected item for the winner
        if (selectedItem) {
          setRedemptionStatus("loading");
          setRedemptionError(null);
          try {
            await api.post("transactions/redemption", {
              userId: parseInt(winnerParticipant.id),
              products: [{ id: selectedItem.id, quantity: 1 }],
            });
            setRedemptionStatus("success");

            // Update the winner's local points so the UI reflects the deduction
            setResidents((prev) =>
              prev.map((r) =>
                String(r.id) === winnerParticipant.id
                  ? {
                      ...r,
                      currentPoints:
                        (r.currentPoints ?? 0) - selectedItem.points,
                    }
                  : r
              )
            );
          } catch (error: any) {
            setRedemptionStatus("error");
            setRedemptionError(
              error?.response?.data?.error?.message ??
                "Redemption failed. Please process manually."
            );
          }
        }
      }
    }, 500);
  };

  const handleCloseWinner = () => {
    setWinner(null);
    setRedemptionStatus("idle");
    setRedemptionError(null);
  };

  const toggleResident = (resId: string) => {
    setSelectedResidents((prev) =>
      prev.includes(resId)
        ? prev.filter((id) => id !== resId)
        : [...prev, resId]
    );
  };

  return (
    <HStack className="flex-1 bg-indigoscale-500 gap-5 p-5">
      {/* spin & win wheel */}
      <VStack className="flex-1" space="lg">
        {/* item selection grid */}
        <VStack className="bg-white rounded-2xl p-4" space="sm">
          <Heading className="text-indigoscale-700" size="md">
            Spinning for
          </Heading>

          {/* search */}
          <Input variant="outline" size="md">
            <InputSlot className="pl-3">
              <InputIcon as={Search} className="text-indigoscale-500" />
            </InputSlot>
            <InputField
              placeholder="Search items..."
              value={itemSearch}
              onChangeText={setItemSearch}
              className="text-indigoscale-700"
            />
            {itemSearch.length > 0 && (
              <InputSlot className="pr-3">
                <Pressable onPress={() => setItemSearch("")}>
                  <InputIcon as={X} className="text-indigoscale-400" />
                </Pressable>
              </InputSlot>
            )}
          </Input>

          {/* product tiles — showcase items only */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="sm">
              {showcaseProducts.length === 0 ? (
                <Text className="text-gray-400 italic py-2">
                  No showcase items available
                </Text>
              ) : (
                showcaseProducts.map((product) => {
                  const isSelected = selectedItemId === String(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() =>
                        setSelectedItemId(isSelected ? "" : String(product.id))
                      }
                      className={`w-28 rounded-xl overflow-hidden border-2 ${
                        isSelected
                          ? "border-indigoscale-700"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        source={product.imageUrl}
                        alt={product.productName}
                        className="w-28 h-28"
                        resizeMode="cover"
                      />
                      <VStack
                        className={`p-2 ${
                          isSelected ? "bg-indigoscale-100" : "bg-gray-50"
                        }`}
                      >
                        <Text
                          size="xs"
                          bold
                          className="text-indigoscale-700"
                          numberOfLines={2}
                        >
                          {product.productName}
                        </Text>
                        <Text size="xs" className="text-indigoscale-500">
                          {product.points} pts
                        </Text>
                      </VStack>
                    </Pressable>
                  );
                })
              )}
            </HStack>
          </ScrollView>

          {!selectedItemId && (
            <Text size="xs" className="text-gray-400 italic">
              Tap an item to select what you're spinning for
            </Text>
          )}
        </VStack>

        <Center className="flex-1 w-full gap-5 p-5">
          <FortuneWheel
            options={wheelOptions}
            colors={wheelColors}
            onSpinEnd={handleSpinEnd}
            isSpinning={spinning}
          />

          <VStack space="md">
            <Button
              action="secondary"
              onPress={handleSpin}
              disabled={spinning || wheelParticipants.length < 1}
            >
              <ButtonText>
                {spinning ? "Spinning..." : "Spin the Wheel!"}
              </ButtonText>
            </Button>

            <Text className="text-white text-center" bold>
              Participants: {wheelParticipants.length}
            </Text>
          </VStack>
        </Center>
      </VStack>

      {/* resident selection */}
      <VStack className="flex-1 bg-white gap-2 p-5 rounded-2xl">
        <Heading className="text-indigoscale-700" size="xl">
          Select Residents
        </Heading>

        {selectedItem && (
          <Text size="xs" className="text-amber-600 italic">
            Only residents with ≥ {selectedItem.points} pts can participate
          </Text>
        )}

        {/* search bar + deselection */}
        <HStack space="sm">
          <Input variant="outline" size="md" className="flex-1">
            <InputSlot className="pl-3">
              <InputIcon as={Search} className="text-indigoscale-500" />
            </InputSlot>
            <InputField
              placeholder="Search residents..."
              value={search}
              onChangeText={setSearch}
              className="text-indigoscale-700"
            />
            {search.length > 0 && (
              <InputSlot className="pr-3">
                <Pressable onPress={() => setSearch("")}>
                  <InputIcon as={X} className="text-indigoscale-400" />
                </Pressable>
              </InputSlot>
            )}
          </Input>
          <Button action="secondary" onPress={handleSelectAll}>
            <ButtonText>Select All</ButtonText>
          </Button>
          <Button action="secondary" onPress={handleDeselectAll}>
            <ButtonText>Deselect All</ButtonText>
          </Button>
        </HStack>

        {/* residents */}
        {loading ? (
          <CustomSpinner text="Loading residents..." />
        ) : filteredResidents.length === 0 ? (
          <EmptyAlert text="No residents found!" />
        ) : (
          <ScrollView
            className="flex-1 mt-2"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <VStack space="sm">
              {filteredResidents.map((res) => {
                const isSelected = selectedResidents.includes(
                  res.id.toString()
                );
                const isEligible =
                  !selectedItem ||
                  (res.currentPoints ?? 0) >= selectedItem.points;

                return (
                  <Checkbox
                    key={res.id}
                    value={res.id.toString()}
                    isChecked={isSelected}
                    isDisabled={!isEligible}
                    onChange={() =>
                      isEligible && toggleResident(res.id.toString())
                    }
                    className="w-full"
                  >
                    <VStack
                      className={`flex-1 p-3 border-2 rounded-xl ${
                        isEligible
                          ? `bg-${res.wallpaperType}scale-300 border-${res.wallpaperType}scale-500`
                          : "bg-gray-100 border-gray-200 opacity-40"
                      }`}
                    >
                      <Heading
                        size="lg"
                        className={
                          isEligible
                            ? `text-${res.wallpaperType}scale-700`
                            : "text-gray-400"
                        }
                        bold
                      >
                        {res.userName}
                      </Heading>
                      <Text
                        className={
                          isEligible
                            ? `text-${res.wallpaperType}scale-700`
                            : "text-gray-400"
                        }
                      >
                        Points: {res.currentPoints ?? 0} | Batch:{" "}
                        {res.batchNumber || "-"}
                        {!isEligible && "  ⛔ Can't afford"}
                      </Text>
                    </VStack>
                  </Checkbox>
                );
              })}
            </VStack>
          </ScrollView>
        )}
      </VStack>

      {/* winner announcement dialog */}
      <alert.AlertDialog isOpen={!!winner} onClose={handleCloseWinner}>
        <alert.AlertDialogBackdrop />
        <alert.AlertDialogContent>
          <alert.AlertDialogHeader>
            <Heading size="lg" className="text-indigoscale-700">
              {winner?.startsWith("Error") ? "Oops!" : "🎉 Congratulations!"}
            </Heading>
          </alert.AlertDialogHeader>

          <alert.AlertDialogBody className="mt-2 mb-4">
            <Text className="text-xl text-center" bold>
              {winner}
            </Text>
            {selectedItem && !winner?.startsWith("Error") && (
              <Text className="text-center text-indigoscale-500 mt-1">
                wins {selectedItem.productName}!
              </Text>
            )}

            {/* Redemption status */}
            {selectedItem && !winner?.startsWith("Error") && (
              <VStack className="mt-4 items-center" space="xs">
                {redemptionStatus === "loading" && (
                  <Text className="text-gray-500 text-sm">
                    ⏳ Processing redemption...
                  </Text>
                )}
                {redemptionStatus === "success" && (
                  <Text className="text-green-600 text-sm font-semibold">
                    ✅ {selectedItem.points} pts deducted successfully
                  </Text>
                )}
                {redemptionStatus === "error" && (
                  <Text className="text-red-500 text-sm text-center">
                    ⚠️ {redemptionError}
                  </Text>
                )}
              </VStack>
            )}
          </alert.AlertDialogBody>

          <alert.AlertDialogFooter>
            <Button
              action="primary"
              size="sm"
              onPress={handleCloseWinner}
              disabled={redemptionStatus === "loading"}
              className="bg-indigoscale-700"
            >
              <ButtonText>
                {redemptionStatus === "loading" ? "Please wait..." : "Awesome!"}
              </ButtonText>
            </Button>
          </alert.AlertDialogFooter>
        </alert.AlertDialogContent>
      </alert.AlertDialog>
    </HStack>
  );
};

export default LotteryPage;
