import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";

import api from "@/utils/api";
import { Resident, WheelParticipant } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import FortuneWheel from "@/components/custom-fortune-wheel";
import SearchBar from "@/components/custom-searchbar";
import CustomSpinner from "@/components/custom-spinner";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import Checkbox from "@/components/custom-checkbox";
import { CheckboxGroup } from "@/components/ui/checkbox";
import { Center } from "@/components/ui/center";

const LotteryPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
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

    fetchResidents();
  }, []);

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
    // Use Map for O(1) lookup instead of O(n) find()
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
    setSelectedResidents(residents.map((res) => res.id.toString()));
  };

  const handleDeselectAll = () => {
    setSelectedResidents([]);
  };

  const handleSpin = () => {
    if (wheelParticipants.length < 1) {
      Alert.alert("Error", "Please select at least 1 participant");
      return;
    }
    setSpinning(true);
  };

  const handleSpinEnd = (winnerName: string) => {
    setSpinning(false);
    Alert.alert("🎉 Congratulations!", winnerName);
  };

  return (
    <HStack className="flex-1 bg-indigoscale-500 gap-5 p-5">
      {/* lottery wheel */}
      <VStack className="flex-1" space="lg">
        <Center className="w-full h-full gap-5 p-5">
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
        {/* search bar + deselection */}
        <HStack space="sm">
          <SearchBar search={search} setSearch={setSearch} />
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
          <ScrollView>
            <VStack>
              <CheckboxGroup
                value={selectedResidents}
                onChange={setSelectedResidents}
              >
                {filteredResidents.map((res) => (
                  <Pressable key={res.id} className="mb-2">
                    <VStack
                      className={`bg-${res.wallpaperType}scale-300 p-3 border-2 border-${res.wallpaperType}scale-500 rounded-xl`}
                    >
                      <Checkbox key={res.id} value={res.id.toString()}>
                        <VStack>
                          <Heading
                            size="lg"
                            className={`text-${res.wallpaperType}scale-700`}
                            bold
                          >
                            {res.userName}
                          </Heading>
                          <Text
                            className={`text-${res.wallpaperType}scale-700`}
                          >
                            Points: {res.currentPoints ?? 0} | Batch:{" "}
                            {res.batchNumber || "-"}
                          </Text>
                        </VStack>
                      </Checkbox>
                    </VStack>
                  </Pressable>
                ))}
              </CheckboxGroup>
            </VStack>
          </ScrollView>
        )}
      </VStack>
    </HStack>
  );
};

export default LotteryPage;
