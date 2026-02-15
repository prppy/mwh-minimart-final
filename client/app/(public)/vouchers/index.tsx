import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import api from "@/utils/api";
import { Voucher } from "@/utils/types";

import SearchableGrid from "@/components/custom-searchable-grid";
import { HStack } from "@/components/ui/hstack";
import Spinner from "@/components/custom-spinner";
// import { Image } from "react-native";

// Dummy data for fallback
const DUMMY_VOUCHERS: Voucher[] = [
  {
    id: 1,
    taskName: "Clean Common Area",
    taskDescription: "Sweep and mop the common area",
    taskCategoryId: 1,
    taskCategory: {
      id: 1,
      taskCategoryName: "Cleaning",
      taskCategoryDescription: "Cleaning tasks",
    },
    imageUrl: "https://picsum.photos/seed/clean/300/300",
    points: 500,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 2,
    taskName: "Prepare Breakfast",
    taskDescription: "Help prepare breakfast for residents",
    taskCategoryId: 2,
    taskCategory: {
      id: 2,
      taskCategoryName: "Cooking",
      taskCategoryDescription: "Cooking tasks",
    },
    imageUrl: "https://picsum.photos/seed/breakfast/300/300",
    points: 800,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 3,
    taskName: "Do Laundry",
    taskDescription: "Wash and fold laundry items",
    taskCategoryId: 3,
    taskCategory: {
      id: 3,
      taskCategoryName: "Laundry",
      taskCategoryDescription: "Laundry tasks",
    },
    imageUrl: "https://picsum.photos/seed/laundry/300/300",
    points: 600,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 4,
    taskName: "Water Plants",
    taskDescription: "Water all plants in the garden",
    taskCategoryId: 4,
    taskCategory: {
      id: 4,
      taskCategoryName: "Gardening",
      taskCategoryDescription: "Gardening tasks",
    },
    imageUrl: "https://picsum.photos/seed/plants/300/300",
    points: 300,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 5,
    taskName: "Organize Storage",
    taskDescription: "Organize and clean storage room",
    taskCategoryId: 1,
    taskCategory: {
      id: 1,
      taskCategoryName: "Cleaning",
      taskCategoryDescription: "Cleaning tasks",
    },
    imageUrl: "https://picsum.photos/seed/storage/300/300",
    points: 700,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 6,
    taskName: "Prepare Lunch",
    taskDescription: "Help prepare lunch for residents",
    taskCategoryId: 2,
    taskCategory: {
      id: 2,
      taskCategoryName: "Cooking",
      taskCategoryDescription: "Cooking tasks",
    },
    imageUrl: "https://picsum.photos/seed/lunch/300/300",
    points: 900,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 7,
    taskName: "Iron Clothes",
    taskDescription: "Iron and press clothing items",
    taskCategoryId: 3,
    taskCategory: {
      id: 3,
      taskCategoryName: "Laundry",
      taskCategoryDescription: "Laundry tasks",
    },
    imageUrl: "https://picsum.photos/seed/iron/300/300",
    points: 400,
    completions: [],
    _count: { completions: 0 },
  },
  {
    id: 8,
    taskName: "Trim Hedges",
    taskDescription: "Trim and shape garden hedges",
    taskCategoryId: 4,
    taskCategory: {
      id: 4,
      taskCategoryName: "Gardening",
      taskCategoryDescription: "Gardening tasks",
    },
    imageUrl: "https://picsum.photos/seed/hedges/300/300",
    points: 550,
    completions: [],
    _count: { completions: 0 },
  },
];

const VouchersPage: React.FC = () => {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await api.get("tasks");
        const fetchedVouchers = response.data.data.tasks || [];
        
        // If no vouchers fetched, use dummy data
        if (fetchedVouchers.length === 0) {
          setVouchers(DUMMY_VOUCHERS);
        } else {
          setVouchers(fetchedVouchers);
        }
      } catch (error) {
        console.error("Error fetching vouchers:", error);
        // Use dummy data on error
        setVouchers(DUMMY_VOUCHERS);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  return (
    <ScrollView className="flex-1 bg-indigoscale-100">
      <HStack className="gap-5 p-5 pb-0 items-start">
        {loading ? (
          <Spinner text="Loading vouchers..." />
        ) : (
          <SearchableGrid
            items={vouchers.map((voucher) => ({
              id: voucher.id,
              name: voucher.taskName,
              points: voucher.points,
              image: voucher.imageUrl 
                ? { uri: voucher.imageUrl } 
                : require("@/assets/logo.png"),
            }))}
            onItemPress={(item) => router.push(`/vouchers/${item.id}`)}
            onAddPress={() => router.push(`/vouchers/0`)}
            noItemsAlert="No vouchers found!"
          />
        )}
      </HStack>
    </ScrollView>
  );
};

export default VouchersPage;