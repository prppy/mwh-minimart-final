import { useAuth } from "@/contexts/auth-context";
import { usePathname, useRouter } from "expo-router";
import {
  ShoppingBag,
  MessageSquare,
  TicketCheck,
  Trophy,
  LogIn,
  LogOut,
  Users,
} from "lucide-react-native";
import { HStack } from "../ui/hstack";
import { Image } from "../ui/image";
import { VStack } from "../ui/vstack";
import { Text } from "../ui/text";
import { Heading } from "../ui/heading";
import { Pressable } from "../ui/pressable";
import { Button, ButtonIcon, ButtonText } from "../ui/button";
import { Divider } from "../ui/divider";
import { useWindowDimensions } from "react-native";

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const { width } = useWindowDimensions();
  const isCompact = width < 1000;

  // tabs
  const normalizePath = (path: string) => {
    return path.replace(/\/\([^/]+\)/g, "").replace(/\/+$/, "");
  };

  const isActiveTab = (route: string) => {
    const cleanPath = normalizePath(pathname);
    const cleanRoute = normalizePath(route);
    return cleanPath === cleanRoute || cleanPath.startsWith(`${cleanRoute}/`);
  };

  const getTabs = () => {
    if (!user) {
      return [
        { name: "Catalogue", route: "/(public)/catalogue", icon: ShoppingBag },
        { name: "Vouchers", route: "/(public)/vouchers", icon: TicketCheck },
        { name: "Feedback", route: "/(public)/feedback", icon: MessageSquare },
        { name: "Leaderboard", route: "/leaderboard", icon: Trophy },
        { name: "Sign In", route: "/login", icon: LogIn },
      ];
    }
    if (role === "resident") {
      return [
        { name: "Profile", route: "/(resident)/", icon: null },
        { name: "Sign Out", route: "/", icon: LogOut, action: "logout" },
      ];
    }
    if (role === "officer" || role === "developer") {
      return [
        { name: "Catalogue", route: "/(public)/catalogue", icon: ShoppingBag },
        { name: "Vouchers", route: "/(public)/vouchers", icon: TicketCheck },
        { name: "Users", route: "/(admin)/users", icon: Users }, 
        { name: "Feedback", route: "/(admin)/feedback", icon: MessageSquare },
        { name: "Lottery", route: "/(admin)/lottery", icon: Trophy },
        { name: "Sign Out", route: "/", icon: LogOut, action: "logout" },
        // { name: "Settings", route: "/(admin)/settings", icon: Settings }, // TODO: settings page
      ];
    }
    return [];
  };

  const tabs = getTabs();
  const activeTab = tabs.find((tab) => isActiveTab(tab.route));
  let activeTabName = activeTab?.name;

  // default to Dashboard if user is officer and no tab matches
  if (!activeTabName && (role === "officer" || role === "developer")) {
    activeTabName = "Dashboard";
  } else if (!activeTabName && role === "resident") {
    activeTabName = "Profile";
  } else if (!activeTabName) {
    activeTabName = "Home";
  }

  // handle presses
  const handleLogoPress = async () => {
    if (!user) {
      router.push("/(public)/catalogue");
    } else if (role === "resident") {
      await logout();
      router.push("/(public)/catalogue");
    } else if (role === "officer" || role === "developer") {
      router.push("/(admin)");
    }
  };

  const handleTabPress = async (tab: any) => {
    if (tab.action === "logout") {
      await logout();
      router.push("/(public)/catalogue");
    } else {
      router.push(tab.route as any);
    }
  };

  return (
    <VStack>
      <HStack className="w-full justify-between items-center px-4 bg-white">
        <Pressable onPress={handleLogoPress}>
          <HStack>
            <Image
              size="lg"
              source={require("@/assets/logo.png")}
              alt="MWH Logo"
            />
            <VStack className="justify-center">
              <Heading className="text-3xl text-indigoscale-700" bold>
                {activeTabName}
              </Heading>
              <Text className="text-indigoscale-500" size={"sm"}>
                MWH Minimart
              </Text>
            </VStack>
          </HStack>
        </Pressable>

        <HStack space={"md"}>
          {tabs
            .filter((tab) => tab.icon != null)
            .map((tab) => {
              const IconComponent = tab.icon;
              const isActive = isActiveTab(tab.route);
              const isAuthButton =
                tab.action === "login" || tab.action === "logout";

              return (
                <Button
                  key={tab.name}
                  onPress={() => handleTabPress(tab)}
                  className={
                    isAuthButton
                      ? isActive
                        ? "bg-redscale-500 border-redscale-700"
                        : "border-redscale-700"
                      : isActive
                      ? "bg-indigoscale-700 border-indigoscale-900"
                      : "border-indigoscale-900"
                  }
                  variant="outline"
                  size="sm"
                >
                  <ButtonIcon
                    as={IconComponent}
                    className={
                      isAuthButton
                        ? isActive
                          ? "text-white"
                          : "text-redscale-500" // redscale-500
                        : isActive
                        ? "text-white"
                        : "text-indigoscale-700" // indigoscale-700
                    }
                  />
                  {!isCompact && (
                    <ButtonText
                      className={
                        isAuthButton
                          ? isActive
                            ? "text-white text-md"
                            : "text-redscale-500 text-md"
                          : isActive
                          ? "text-white text-md"
                          : "text-indigoscale-700 text-md"
                      }
                    >
                      {tab.name}
                    </ButtonText>
                  )}
                </Button>
              );
            })}
        </HStack>
      </HStack>
      <Divider />
    </VStack>
  );
};

export default Header;
