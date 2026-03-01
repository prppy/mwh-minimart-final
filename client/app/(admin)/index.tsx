import { useEffect, useState } from "react";
import { Check, EyeOff, Pencil, Plus, Trash, X } from "lucide-react-native";

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

const AdminPage: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);

  useEffect(() => {
    const fetchMiniLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard/month", {
          params: { period: "month", month: new Date().getMonth(), limit: 3 },
        });
        if (res.data.success) {
          const data = res.data.data.residents;
          setPerformers(data);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setPerformers([]);
      }
    };

    fetchMiniLeaderboard();
  }, []);

  return (
    <HStack className="flex-1 gap-5 p-5 pb-0 bg-indigoscale-500">
      <VStack className="flex-1 gap-8">
        {/* voucher trasactions per batch */}
        <VStack className="w-full gap-2 p-5 bg-white rounded-xl shadow-md">
          <Heading className="text-indigoscale-700" size="xl">
            Your Batch: B1
          </Heading>
          <table.Table className="w-full">
            <table.TableHeader>
              <table.TableRow className="bg-indigoscale-100">
                <table.TableHead>Resident</table.TableHead>
                <table.TableHead>Voucher</table.TableHead>
                <table.TableHead>Points</table.TableHead>
                <table.TableHead>Actions</table.TableHead>
              </table.TableRow>
            </table.TableHeader>
            <table.TableBody>
              <table.TableRow>
                <table.TableData>Resident 1</table.TableData>
                <table.TableData>Voucher 1</table.TableData>
                <table.TableData>100</table.TableData>
                <table.TableData className="flex justify-around">
                  <Pressable>
                    <Icon as={Check} className="text-greenscale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={X} className="text-redscale-700" />
                  </Pressable>
                </table.TableData>
              </table.TableRow>
              <table.TableRow>
                <table.TableData>Resident 2</table.TableData>
                <table.TableData>Voucher 2</table.TableData>
                <table.TableData>210</table.TableData>
                <table.TableData className="flex justify-around">
                  <Pressable>
                    <Icon as={Check} className="text-greenscale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={X} className="text-redscale-700" />
                  </Pressable>
                </table.TableData>
              </table.TableRow>
            </table.TableBody>
          </table.Table>
        </VStack>

        {/* low stock alert */}
        <VStack className="w-full gap-2 p-5 bg-white rounded-xl shadow-md">
          <Heading className="text-indigoscale-700" size="xl">
            Low Stock Alert
          </Heading>
          <table.Table className="w-full">
            <table.TableHeader>
              <table.TableRow className="bg-indigoscale-100">
                <table.TableHead>Product</table.TableHead>
                <table.TableHead>Quantity</table.TableHead>
                <table.TableHead>Actions</table.TableHead>
              </table.TableRow>
            </table.TableHeader>
            <table.TableBody>
              <table.TableRow>
                <table.TableData>Milo</table.TableData>
                <table.TableData>10</table.TableData>
                <table.TableData className="flex justify-around">
                  <Pressable>
                    <Icon as={Pencil} className="text-greenscale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={EyeOff} className="text-orangescale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={Trash} className="text-redscale-700" />
                  </Pressable>
                </table.TableData>
              </table.TableRow>
              <table.TableRow>
                <table.TableData>Indomie</table.TableData>
                <table.TableData>12</table.TableData>
                <table.TableData className="flex justify-around">
                  <Pressable>
                    <Icon as={Pencil} className="text-greenscale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={EyeOff} className="text-orangescale-700" />
                  </Pressable>
                  <Pressable>
                    <Icon as={Trash} className="text-redscale-700" />
                  </Pressable>
                </table.TableData>
              </table.TableRow>
            </table.TableBody>
          </table.Table>
        </VStack>
        <VStack></VStack>
      </VStack>

      <VStack className="flex-1 gap-8">
        {/* shortcuts */}
        <VStack className="w-full gap-2 p-5 bg-white rounded-xl shadow-md">
          <Heading className="text-indigoscale-700" size="xl">
            Shortcuts
          </Heading>
          <HStack space="md">
            <Icon as={Plus} className="text-typography-700" />
            <Text>Assign points to a Resident</Text>
          </HStack>
          <HStack space="md">
            <Icon as={Plus} className="text-typography-700" />
            <Text>Add a new Product</Text>
          </HStack>
          <HStack space="md">
            <Icon as={Plus} className="text-typography-700" />
            <Text>Add a new Voucher</Text>
          </HStack>
        </VStack>

        {/* mini leaderboard */}
        <VStack className="w-full gap-2 p-5 bg-white rounded-xl shadow-md">
          <Heading className="text-indigoscale-700" size="xl">
            Leaderboard
          </Heading>
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
      </VStack>
    </HStack>
  );
};

export default AdminPage;
