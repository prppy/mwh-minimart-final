import React from "react";
import { useRouter, usePathname } from "expo-router";
import {
  Box,
  HStack,
  VStack,
  Image,
  Text,
  Pressable,
  useBreakpointValue,
} from "@gluestack-ui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ShoppingBag,
  Trophy,
  MessageSquare,
  User,
  Laugh,
} from "lucide-react-native";

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Get current tab name from pathname
  const getCurrentTabName = () => {
    if (pathname.startsWith("/catalogue")) return "catalogue";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/feedback")) return "feedback";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/admin")) return "admin"; // TEMP: admin dashboard screen
    return "catalogue"; // default
  };

  const currentTab = getCurrentTabName();

  const tabs = [
    {
      name: "Catalogue",
      route: "/catalogue",
      icon: ShoppingBag,
    },
    {
      name: "Leaderboard",
      route: "/leaderboard",
      icon: Trophy,
    },
    {
      name: "Feedback",
      route: "/feedback",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      route: "/profile",
      icon: User,
    },
    {
      name: "Admin TEMP",
      route: "/admin",
      icon: Laugh,
    },
  ];

  const isActiveTab = (route: string) => {
    return pathname.startsWith(route);
  };

  const handleLogoPress = () => {
    router.push("/catalogue");
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  // Responsive text size
  const logoTextSize = useBreakpointValue({
    base: 24,
    sm: 28,
    md: 32,
  });

  return (
    <SafeAreaView edges={["top"]}>
      <Box
        backgroundColor="#ffffff"
        borderBottomWidth={1}
        borderBottomColor="#e5e7eb"
        paddingHorizontal={16}
        paddingVertical={12}
      >
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left: Logo and Title */}
          <Pressable onPress={handleLogoPress}>
            <HStack alignItems="center" gap={16}>
              <Image
                source={require("../assets/logo.png")}
                alt="MWH Logo"
                style={{ width: 100, height: 100 }}
              />

              <VStack gap={4}>
                <Text fontSize={logoTextSize} fontWeight="700" color="#273C73">
                  {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                </Text>
                <Text fontSize={15} color="#6b7280" lineHeight={15}>
                  MWH Minimart
                </Text>
              </VStack>
            </HStack>
          </Pressable>

          {/* Right: Navigation Tabs */}
          <HStack gap={20} alignItems="center">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = isActiveTab(tab.route);

              return (
                <Pressable
                  key={tab.route}
                  onPress={() => handleTabPress(tab.route)}
                  backgroundColor={isActive ? "#273C73" : "#f3f4f6"}
                  paddingHorizontal={12}
                  paddingVertical={8}
                  borderRadius={8}
                  style={{
                    shadowColor: isActive ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.1 : 0,
                    shadowRadius: 2,
                    elevation: isActive ? 2 : 0,
                  }}
                >
                  <HStack alignItems="center" gap={6}>
                    <IconComponent
                      size={20}
                      color={isActive ? "#ffffff" : "#6b7280"}
                    />
                    <Text
                      fontSize={20}
                      fontWeight={isActive ? "600" : "500"}
                      color={isActive ? "#ffffff" : "#6b7280"}
                    >
                      {tab.name}
                    </Text>
                  </HStack>
                </Pressable>
              );
            })}
          </HStack>
        </HStack>
      </Box>
    </SafeAreaView>
  );
};

export default Header;
