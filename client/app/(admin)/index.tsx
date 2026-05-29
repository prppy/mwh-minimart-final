import { useEffect, useState } from "react";
import { Check, EyeOff, Pencil, Plus, Trash, X, Package, MessageSquare, TrendingUp, Award } from "lucide-react-native";
import { ScrollView } from "react-native";

import api from "@/utils/api";
import { Performer } from "@/utils/types";

import LeaderboardCard from "@/components/custom-leaderboard-card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import * as table from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

interface FeedbackMetrics {
  received: number;
  resolved: number;
}

interface HighDemandItem {
  id: number;
  productName: string;
  points: number;
  redemptionCount: number;
}

interface ResidentMetric {
  userId: number;
  userName: string;
  vouchersCount: number;
  totalPoints: number;
  currentPoints: number;
}

interface AdminMetrics {
  stocksAvailable: number;
  feedbacks: FeedbackMetrics;
  highDemandItems: HighDemandItem[];
  residentMetrics: ResidentMetric[];
}

const AdminPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get("/admin/metrics");
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error("Metrics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <ScrollView className="flex-1 bg-indigoscale-500">
      <VStack className="p-5 gap-6">
        
        {/* Stat Cards Grid */}
        <HStack className="w-full gap-4 flex-wrap">
          {/* Card 1: Stocks Available */}
          <VStack className="flex-1 min-w-[200px] p-5 bg-white rounded-xl shadow-md gap-2 border-l-4 border-indigoscale-500">
            <HStack className="justify-between items-center">
              <Text className="text-indigoscale-700 font-bold">Stocks Available</Text>
              <Icon as={Package} className="text-indigoscale-500" size="xl" />
            </HStack>
            <Heading className="text-typography-900" size="2xl">
              {loading ? "..." : (metrics?.stocksAvailable ?? 0)}
            </Heading>
            <Text className="text-xs text-typography-500">Active catalog products</Text>
          </VStack>

          {/* Card 2: Feedbacks Received */}
          <VStack className="flex-1 min-w-[200px] p-5 bg-white rounded-xl shadow-md gap-2 border-l-4 border-greenscale-500">
            <HStack className="justify-between items-center">
              <Text className="text-greenscale-700 font-bold">Feedbacks Received</Text>
              <Icon as={MessageSquare} className="text-greenscale-500" size="xl" />
            </HStack>
            <Heading className="text-typography-900" size="2xl">
              {loading ? "..." : (metrics?.feedbacks.received ?? 0)}
            </Heading>
            <Text className="text-xs text-typography-500">Total user reviews</Text>
          </VStack>

          {/* Card 3: Feedbacks Resolved */}
          <VStack className="flex-1 min-w-[200px] p-5 bg-white rounded-xl shadow-md gap-2 border-l-4 border-orangescale-500">
            <HStack className="justify-between items-center">
              <Text className="text-orangescale-700 font-bold">Feedbacks Resolved</Text>
              <Icon as={Check} className="text-orangescale-500" size="xl" />
            </HStack>
            <Heading className="text-typography-900" size="2xl">
              {loading ? "..." : (metrics?.feedbacks.resolved ?? 0)}
            </Heading>
            <Text className="text-xs text-typography-500">Addressed feedback status</Text>
          </VStack>
        </HStack>

        <HStack className="w-full gap-5 flex-wrap">
          {/* Left Column: Vouchers & Points Summary */}
          <VStack className="flex-[2] min-w-[300px] gap-6">
            <VStack className="w-full gap-4 p-5 bg-white rounded-xl shadow-md">
              <HStack className="items-center gap-2">
                <Icon as={Award} className="text-indigoscale-700" size="xl" />
                <Heading className="text-indigoscale-700" size="xl">
                  Resident Vouchers & Points Issued
                </Heading>
              </HStack>
              
              <table.Table className="w-full">
                <table.TableHeader>
                  <table.TableRow className="bg-indigoscale-100">
                    <table.TableHead>Resident</table.TableHead>
                    <table.TableHead>Vouchers Completed</table.TableHead>
                    <table.TableHead>Total Issued</table.TableHead>
                    <table.TableHead>Current Balance</table.TableHead>
                  </table.TableRow>
                </table.TableHeader>
                <table.TableBody>
                  {loading ? (
                    <table.TableRow>
                      <table.TableData className="text-center" colSpan={4}>Loading resident metrics...</table.TableData>
                    </table.TableRow>
                  ) : metrics?.residentMetrics.length === 0 ? (
                    <table.TableRow>
                      <table.TableData className="text-center" colSpan={4}>No resident data available</table.TableData>
                    </table.TableRow>
                  ) : (
                    metrics?.residentMetrics.map((r) => (
                      <table.TableRow key={r.userId}>
                        <table.TableData className="font-semibold text-indigoscale-900">{r.userName}</table.TableData>
                        <table.TableData>{r.vouchersCount} completed</table.TableData>
                        <table.TableData className="font-bold text-greenscale-700">{r.totalPoints} pts</table.TableData>
                        <table.TableData className="font-bold text-indigoscale-700">{r.currentPoints} pts</table.TableData>
                      </table.TableRow>
                    ))
                  )}
                </table.TableBody>
              </table.Table>
            </VStack>
          </VStack>

          {/* Right Column: High Demand Items */}
          <VStack className="flex-1 min-w-[250px] gap-6">
            {/* High Demand Items */}
            <VStack className="w-full gap-4 p-5 bg-white rounded-xl shadow-md">
              <HStack className="items-center gap-2">
                <Icon as={TrendingUp} className="text-greenscale-700" size="xl" />
                <Heading className="text-greenscale-700" size="xl">
                  High Demand Items
                </Heading>
              </HStack>
              
              <table.Table className="w-full">
                <table.TableHeader>
                  <table.TableRow className="bg-greenscale-100">
                    <table.TableHead>Product</table.TableHead>
                    <table.TableHead>Redemptions</table.TableHead>
                    <table.TableHead>Price</table.TableHead>
                  </table.TableRow>
                </table.TableHeader>
                <table.TableBody>
                  {loading ? (
                    <table.TableRow>
                      <table.TableData className="text-center" colSpan={3}>Loading high demand items...</table.TableData>
                    </table.TableRow>
                  ) : metrics?.highDemandItems.length === 0 ? (
                    <table.TableRow>
                      <table.TableData className="text-center" colSpan={3}>No redemptions yet</table.TableData>
                    </table.TableRow>
                  ) : (
                    metrics?.highDemandItems.map((item) => (
                      <table.TableRow key={item.id}>
                        <table.TableData className="font-semibold text-typography-900">{item.productName}</table.TableData>
                        <table.TableData className="font-bold text-greenscale-700">{item.redemptionCount} times</table.TableData>
                        <table.TableData>{item.points} pts</table.TableData>
                      </table.TableRow>
                    ))
                  )}
                </table.TableBody>
              </table.Table>
            </VStack>
          </VStack>
        </HStack>

      </VStack>
    </ScrollView>
  );
};

export default AdminPage;

