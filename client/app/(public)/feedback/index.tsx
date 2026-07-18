import { useRouter } from "expo-router";
import { Box, Star } from "lucide-react-native";

import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useWindowDimensions, View } from "react-native";

const MOBILE_BREAKPOINT = 768;

const FeedbackPage: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <Center className="flex-1 bg-white">
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 48,
          paddingHorizontal: isMobile ? 16 : 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={() => router.push("/(public)/feedback/product-request")}
          style={{ width: isMobile ? "100%" : 384 }}
        >
          <Center
            className={`${isMobile ? "h-48" : "h-64"} gap-2 p-5 border border-indigoscale-700 rounded-lg`}
          >
            <Icon as={Box} size="xl" className="text-indigoscale-700" />
            <Heading size={isMobile ? "xl" : "2xl"} className="text-indigoscale-700">
              Product Request
            </Heading>
            <Text size={isMobile ? "md" : "xl"} className="text-indigoscale-700">
              Can&apos;t find what you need?
            </Text>
          </Center>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(public)/feedback/rate-us")}
          style={{ width: isMobile ? "100%" : 384 }}
        >
          <Center
            className={`${isMobile ? "h-48" : "h-64"} gap-2 p-5 border border-indigoscale-700 rounded-lg`}
          >
            <Icon as={Star} size="xl" className="text-indigoscale-700" />
            <Heading size={isMobile ? "xl" : "2xl"} className="text-indigoscale-700">
              Rate Us
            </Heading>
            <Text size={isMobile ? "md" : "xl"} className="text-indigoscale-700">
              Tell us how to improve!
            </Text>
          </Center>
        </Pressable>
      </View>
    </Center>
  );
};

export default FeedbackPage;
