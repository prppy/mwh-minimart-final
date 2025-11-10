import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import api from "@/utils/api";
import { Performer } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import LeaderboardCard from "@/components/custom-leaderboard-card";
import Spinner from "@/components/custom-spinner";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentMonthIndex = new Date().getMonth();
const maxAvailableMonthIndex = currentMonthIndex;

const LeaderboardPage: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [monthIndex, setMonthIndex] = useState(currentMonthIndex);
  const [cache, setCache] = useState<Record<number, Performer[]>>({});
  const [loading, setLoading] = useState(true);

  const selectedMonth = months[monthIndex];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (cache[monthIndex]) {
        setPerformers(cache[monthIndex]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get("/leaderboard/month", {
          params: { period: "month", month: monthIndex + 1, limit: 5 },
        });
        if (res.data.success) {
          const data = res.data.data.residents;
          setPerformers(data);
          setCache((prev) => ({ ...prev, [monthIndex]: data }));
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setPerformers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [monthIndex, cache]);

  return (
    <Center className="w-full h-full p-5 pb-0 bg-white">
      <VStack
        className="w-full p-5 border border-gray-300 rounded-lg"
        space="md"
      >
        <HStack className="w-full items-center justify-between">
          <Pressable
            disabled={monthIndex === 0}
            onPress={() => setMonthIndex((prev) => Math.max(0, prev - 1))}
          >
            <Icon as={ChevronLeft} size="xl" className="text-indigoscale-700 " />
          </Pressable>
          <Heading className="text-2xl text-indigoscale-700">
            {selectedMonth}
          </Heading>
          <Pressable
            disabled={monthIndex === maxAvailableMonthIndex}
            onPress={() =>
              setMonthIndex((prev) =>
                Math.min(maxAvailableMonthIndex, prev + 1)
              )
            }
          >
            <Icon
              as={ChevronRight}
              size="xl"
              className="text-indigoscale-700"
            />
          </Pressable>
        </HStack>
        <Divider />
        {loading ? (
          <Spinner text="Loading top performers..." />
        ) : performers.length === 0 ? (
          <EmptyAlert text="No performers found!" />
        ) : (
          <ScrollView>
            <VStack space="lg">
              {performers.map((p) => (
                <LeaderboardCard
                  key={p.rank}
                  name={p.userName}
                  points={p.periodPoints}
                  background={p.backgroundType}
                  wallpaperColour={p.wallpaperType}
                />
              ))}
            </VStack>
          </ScrollView>
        )}
      </VStack>
    </Center>
  );
};

export default LeaderboardPage;
