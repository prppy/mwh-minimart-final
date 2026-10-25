import { useRouter } from "expo-router";
import { Box, LucideIcon, Star } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { Center } from "@/components/ui/center";

const MOBILE_BREAKPOINT = 768;
const BLUE = "#273C73"; // indigoscale-700

type FeedbackOptionProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
  isMobile: boolean;
};

/** Option card that fills with colour when hovered or pressed */
const FeedbackOption: React.FC<FeedbackOptionProps> = ({ icon: OptionIcon, title, subtitle, onPress, isMobile }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({ hovered, pressed }: any) => {
      const active = hovered || pressed;
      return {
        width: isMobile ? "100%" : 560,
        height: isMobile ? 220 : 380,
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 10 : 16,
        padding: 20,
        borderWidth: 1,
        borderColor: BLUE,
        borderRadius: 20,
        backgroundColor: active ? BLUE : "#ffffff",
        transform: [{ scale: pressed ? 0.98 : hovered ? 1.03 : 1 }],
        shadowColor: BLUE,
        shadowOpacity: active ? 0.25 : 0,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        // Smooth colour change on web
        transitionDuration: "150ms",
      } as any;
    }}
  >
    {({ hovered, pressed }: any) => {
      const color = hovered || pressed ? "#ffffff" : BLUE;
      return (
        <>
          <OptionIcon size={isMobile ? 40 : 64} color={color} />
          <Text style={{ color, fontSize: isMobile ? 24 : 36, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color, fontSize: isMobile ? 18 : 24 }}>{subtitle}</Text>
        </>
      );
    }}
  </Pressable>
);

const FeedbackPage: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <Center className="flex-1 bg-white">
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap", // the cards stack on tablet-width screens
          gap: isMobile ? 16 : 56,
          paddingHorizontal: isMobile ? 16 : 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FeedbackOption
          icon={Box}
          title="Product Request"
          subtitle="Can't find what you need?"
          onPress={() => router.push("/(public)/feedback/product-request")}
          isMobile={isMobile}
        />
        <FeedbackOption
          icon={Star}
          title="Rate Us"
          subtitle="Tell us how to improve!"
          onPress={() => router.push("/(public)/feedback/rate-us")}
          isMobile={isMobile}
        />
      </View>
    </Center>
  );
};

export default FeedbackPage;
