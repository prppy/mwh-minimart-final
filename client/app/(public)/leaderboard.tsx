import { useEffect, useState, useCallback } from "react";
import { ScrollView } from "react-native";

import api from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { Performer } from "@/utils/types";

import EmptyAlert from "@/components/custom-empty-alert";
import LeaderboardCard from "@/components/custom-leaderboard-card";
import Spinner from "@/components/custom-spinner";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const currentMonth = new Date().getMonth();

const LeaderboardPage: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/leaderboard/month", {
        params: { period: "month", month: currentMonth + 1, limit: 5 },
      });
      if (res.data.success) {
        setPerformers(res.data.data.residents);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setPerformers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Subscribe to Supabase Realtime for live leaderboard updates
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MWH_Transaction",
        },
        (_payload) => {
          console.log("Realtime: new transaction detected, refreshing leaderboard");
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const formattedDate = lastUpdated.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = lastUpdated.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <Center className="w-full h-full p-5 pb-5 bg-white">
      <VStack
        className="w-full p-5 border border-gray-300 rounded-lg"
        space="md"
      >
        <Heading className="text-2xl text-indigoscale-700 text-center">
          Leaderboard
        </Heading>
        <Text className="text-sm text-gray-500 text-center">
          Updated as of {formattedDate}, {formattedTime}
        </Text>
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
                  vouchersAwarded={p.vouchersAwarded}
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
