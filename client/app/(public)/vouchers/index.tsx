import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import api from "@/utils/api";
import { Voucher } from "@/utils/types";

import SearchableGrid from "@/components/custom-searchable-grid";
import { HStack } from "@/components/ui/hstack";
import Spinner from "@/components/custom-spinner";

const VouchersPage: React.FC = () => {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await api.get("tasks");
        setVouchers(response.data.data.tasks || []);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  return (
    <HStack className="flex-1 gap-5 p-5 pb-0 bg-indigoscale-100 items-start">
      {loading ? (
        <Spinner text="Loading vouchers..." />
      ) : (
        <SearchableGrid
          items={vouchers.map((voucher) => ({
            id: voucher.id,
            name: voucher.taskName,
            points: voucher.points,
            image: "@/assets/logo.png", // TODO: add image field to voucher
          }))}
          onItemPress={(item) => router.push(`/vouchers/${item.id}`)}
          onAddPress={() => router.push(`/vouchers/0`)}
          noItemsAlert="No vouchers found!"
        />
      )}
    </HStack>
  );
};

export default VouchersPage;
