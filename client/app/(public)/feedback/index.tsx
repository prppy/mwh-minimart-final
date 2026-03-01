import { useRouter } from "expo-router";
import { Box, Star } from "lucide-react-native";

import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

const FeedbackPage: React.FC = () => {
  const router = useRouter();

  return (
    <Center className="flex-1 bg-white">
      <HStack space="4xl">
        <Pressable
          onPress={() => router.push("/(public)/feedback/product-request")}
        >
          <Center className="h-64 w-96 gap-2 p-5 border border-indigoscale-700 rounded-lg">
            <Icon as={Box} size={64} className="text-indigoscale-700" />
            <Heading size="2xl" className="text-indigoscale-700">
              Product Request
            </Heading>
            <Text size="xl" className="text-indigoscale-700">
              Can&apos;t find what you need?
            </Text>
          </Center>
        </Pressable>
        <Pressable onPress={() => router.push("/(public)/feedback/rate-us")}>
          <Center className="h-64 w-96 gap-2 p-5 border border-indigoscale-700 rounded-lg">
            <Icon as={Star} size={64} className="text-indigoscale-700" />
            <Heading size="2xl" className="text-indigoscale-700">
              Rate Us
            </Heading>
            <Text size="xl" className="text-indigoscale-700">
              Tell us how to improve!
            </Text>
          </Center>
        </Pressable>
      </HStack>
    </Center>
  );
};

export default FeedbackPage;
