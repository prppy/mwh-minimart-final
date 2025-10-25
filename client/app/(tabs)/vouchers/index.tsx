import React, { useState, useEffect } from "react";
import { VStack, HStack, Box } from "@gluestack-ui/themed";
import VoucherGrid from "@/components/vouchers/VoucherGrid";
import SearchBar from "@/components/Searchbar";
import CustomButton from "@/components/CustomButton";
import { ADMIN_PURPLE } from "@/constants/colors";
import api from "@/components/utility/api";

export default function VoucherPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"asc" | "desc" | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]); // you can type it properly if you know the shape
  const [loading, setLoading] = useState(true);

  // fetch vouchers from API
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await api.get("tasks"); // your API call
        console.log(response.data.data);
        setVouchers(response.data.data.tasks || []); // assuming response.data is an array
      } catch (error) {
        console.error("Failed to fetch vouchers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  // Ensure we have an array before filtering
  const filteredVouchers = Array.isArray(vouchers)
    ? vouchers.filter((v) =>
        v.taskName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const sortedVouchers =
    sort === "asc"
      ? [...filteredVouchers].sort((a, b) => a.points - b.points)
      : sort === "desc"
      ? [...filteredVouchers].sort((a, b) => b.points - a.points)
      : filteredVouchers;

  if (loading)
    return (
      <Box sx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        Loading...
      </Box>
    );

  return (
    <VStack flex={1} sx={styles.container}>
      <HStack alignItems="center" mb={20} space="md">
        <Box sx={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search vouchers..."
          />
        </Box>

        <CustomButton isActive={sort === "asc"} onPress={() => setSort("asc")}>
          Point ascending
        </CustomButton>

        <CustomButton
          isActive={sort === "desc"}
          onPress={() => setSort("desc")}
        >
          Points descending
        </CustomButton>
      </HStack>

      <VoucherGrid
        data={[
          {
            id: "add",
            taskName: "Add Voucher",
            image: require("@/assets/Add.png"),
          },
          ...sortedVouchers,
        ]}
      />
    </VStack>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: ADMIN_PURPLE,
    padding: 30,
  },
};
