import React, { useEffect, useState } from "react";
import { ScrollView, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Users, HeartPulse, Leaf, ChevronLeft, ChevronRight, HeartHandshake, HandHeart } from "lucide-react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";

import api from "@/utils/api";
import { Product } from "@/utils/types";

const PublicLandingPage: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("products");
        let fetchedProducts: Product[] = [];
        if (Array.isArray(response.data.data)) {
          fetchedProducts = response.data.data;
        } else if (Array.isArray(response.data.data.products)) {
          fetchedProducts = response.data.data.products;
        }
        setProducts(fetchedProducts.slice(0, 4));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Box className="w-full h-[500px] justify-center items-center overflow-hidden relative">
        <Image
          source={require("@/assets/images/hero_bg.jpg")}
          className="absolute inset-0 w-full h-full"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          resizeMode="cover"
          alt="Hero Background"
        />

        <Box className="absolute inset-0 bg-black/50" />
        <VStack className="absolute inset-0 z-10 px-10 py-16 max-w-7xl mx-auto w-full justify-center items-start">
          <VStack space="lg" className="max-w-2xl">
            <Heading size="3xl" className="text-white">
              Welcome back! Your{"\n"}rewards are waiting.
            </Heading>
            <Text size="lg" className="text-white font-medium">
              Redeem your hard-earned points for products you{"\n"}love and achieve your goals.
            </Text>
            <Button
              size="lg"
              className="bg-indigoscale-100 border-none rounded-md px-6 py-3 self-start mt-2"
              onPress={() => router.push("/(public)/catalogue")}
            >
              <ButtonText className="text-indigoscale-900 font-bold">
                Redeem Your Points Now
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </Box>

      {/* How to Earn & Spend Points */}
      <VStack className="px-10 py-16 max-w-7xl mx-auto w-full" space="xl">
        <Heading size="xl" className="text-indigoscale-900 mb-4">
          How to Earn & Spend Points
        </Heading>
        <HStack space="lg" className="justify-between flex-wrap gap-4">
          <Card className="flex-1 min-w-[300px] p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <VStack space="md">
              <Icon as={Users} size="xl" className="text-indigoscale-700 h-8 w-8" />
              <Heading size="md" className="text-indigoscale-900">Good Behaviour</Heading>
              <Text className="text-gray-600">
                Earn points for positive conduct and helpfulness.
              </Text>
            </VStack>
          </Card>
          <Card className="flex-1 min-w-[300px] p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <VStack space="md">
              <Icon as={HeartHandshake} size="xl" className="text-indigoscale-700 h-8 w-8" />
              <Heading size="md" className="text-indigoscale-900">Daily Tasks</Heading>
              <Text className="text-gray-600">
                Complete chores and responsibilities to build your credit.
              </Text>
            </VStack>
          </Card>
          <Card className="flex-1 min-w-[300px] p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <VStack space="md">
              <Icon as={HandHeart} size="xl" className="text-indigoscale-700 h-8 w-8" />
              <Heading size="md" className="text-indigoscale-900">Goal Achievement</Heading>
              <Text className="text-gray-600">
                Reach your personal goals and earn bonus rewards.
              </Text>
            </VStack>
          </Card>
        </HStack>
      </VStack>

      {/* Featured Products */}
      <VStack className="px-10 pb-20 max-w-7xl mx-auto w-full" space="xl">
        <HStack className="justify-between items-center mb-4">
          <Heading size="xl" className="text-indigoscale-900">
            Featured Products
          </Heading>
          <HStack space="md">
            <Pressable className="p-2 bg-white rounded-full shadow-sm border border-gray-100">
              <Icon as={ChevronLeft} size="md" className="text-gray-400 h-5 w-5" />
            </Pressable>
            <Pressable className="p-2 bg-white rounded-full shadow-sm border border-gray-100">
              <Icon as={ChevronRight} size="md" className="text-gray-800 h-5 w-5" />
            </Pressable>
          </HStack>
        </HStack>

        <HStack space="lg" className="flex-wrap justify-center gap-4">
          {products.map((product) => (
            <Pressable
              key={product.id}
              className="flex-1 min-w-[250px]"
              onPress={() => router.push(`/(public)/catalogue/${product.id}`)}
            >
              <Card className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl h-full">
                <Center className="w-full h-48 bg-indigoscale-100 rounded-lg mb-4 p-2">
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      alt={product.productName}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  ) : null}
                </Center>
                <VStack space="sm">
                  <Text size="lg" className="text-indigoscale-900 font-semibold" numberOfLines={1}>
                    {product.productName}
                  </Text>
                  <Text className="text-gray-600 font-medium">
                    {product.points} pts
                  </Text>
                </VStack>
              </Card>
            </Pressable>
          ))}
          {/* Dummy placeholders if no products */}
          {products.length === 0 && !loading && (
            <Text>No featured products available.</Text>
          )}
        </HStack>
      </VStack>
    </ScrollView>
  );
};

export default PublicLandingPage;
