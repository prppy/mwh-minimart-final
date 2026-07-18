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
  UserCircle,
  Monitor,
  Menu,
  X,
} from "lucide-react-native";
import { HStack } from "../ui/hstack";
import { Image } from "../ui/image";
import { VStack } from "../ui/vstack";
import { Text } from "../ui/text";
import { Heading } from "../ui/heading";
import { Pressable } from "../ui/pressable";
import { Button, ButtonIcon, ButtonText } from "../ui/button";
import { Divider } from "../ui/divider";
import {
  useWindowDimensions,
  Animated,
  Platform,
  View,
} from "react-native";
import { useState, useRef, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const isCompact = width < 1000;

  const [menuOpen, setMenuOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  // Close menu when switching away from mobile
  useEffect(() => {
    if (!isMobile && menuOpen) {
      setMenuOpen(false);
      animatedHeight.setValue(0);
    }
  }, [isMobile]);

  // Animate menu open/close
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: menuOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [menuOpen]);

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
        { name: "Sign In", route: "/login", icon: LogIn, action: "login" },
      ];
    }
    if (role === "resident") {
      return [
        { name: "Catalogue", route: "/(public)/catalogue", icon: ShoppingBag },
        { name: "Vouchers", route: "/(public)/vouchers", icon: TicketCheck },
        { name: "Feedback", route: "/(public)/feedback", icon: MessageSquare },
        { name: "Leaderboard", route: "/leaderboard", icon: Trophy },
        { name: "Profile", route: "/(resident)/profile", icon: UserCircle },
        { name: "Sign Out", route: "/", icon: LogOut, action: "logout" },
      ];
    }
    if (
      role === "admin" ||
      role === "superadmin" ||
      role === "officer" ||
      role === "developer"
    ) {
      return [
        { name: "Catalogue", route: "/(public)/catalogue", icon: ShoppingBag },
        { name: "Vouchers", route: "/(admin)/voucher-management", icon: TicketCheck },
        { name: "Users", route: "/(admin)/users", icon: Users },
        { name: "Feedback", route: "/(admin)/feedback", icon: MessageSquare },
        { name: "Spin & Win", route: "/(admin)/lottery", icon: Trophy },
        { name: "Screensaver", route: "/(admin)/screensaver", icon: Monitor },
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
  if (
    !activeTabName &&
    (role === "admin" ||
      role === "superadmin" ||
      role === "officer" ||
      role === "developer")
  ) {
    activeTabName = "Dashboard";
  } else if (!activeTabName && role === "resident") {
    activeTabName = "Profile";
  } else if (!activeTabName) {
    activeTabName = "Home";
  }

  // handle presses
  const handleLogoPress = async () => {
    if (!user) {
      router.push("/(public)");
    } else if (role === "resident") {
      await logout();
      router.push("/(public)");
    } else if (
      role === "admin" ||
      role === "superadmin" ||
      role === "officer" ||
      role === "developer"
    ) {
      router.push("/(admin)");
    }
    setMenuOpen(false);
  };

  const handleTabPress = async (tab: any) => {
    if (tab.action === "logout") {
      await logout();
      router.replace("/(public)");
    } else if (isActiveTab(tab.route)) {
      // Already on this tab, just close menu
    } else {
      router.push(tab.route as any);
    }
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Render a single tab button (shared between desktop and mobile)
  const renderTabButton = (tab: any, isMobileMenu: boolean = false) => {
    const IconComponent = tab.icon;
    const isActive = isActiveTab(tab.route);
    const isAuthButton = tab.action === "login" || tab.action === "logout";

    if (isMobileMenu) {
      return (
        <Pressable
          key={tab.name}
          onPress={() => handleTabPress(tab)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: isActive
              ? isAuthButton
                ? "#D5452A"
                : "#273C73"
              : "transparent",
            borderRadius: 8,
            gap: 12,
          }}
        >
          <IconComponent
            size={20}
            color={
              isActive
                ? "#FFFFFF"
                : isAuthButton
                  ? "#D5452A"
                  : "#273C73"
            }
          />
          <Text
            style={{
              color: isActive
                ? "#FFFFFF"
                : isAuthButton
                  ? "#D5452A"
                  : "#273C73",
              fontSize: 15,
              fontWeight: isActive ? "600" : "500",
            }}
          >
            {tab.name}
          </Text>
        </Pressable>
      );
    }

    // Desktop tab button
    return (
      <Button
        key={tab.name}
        onPress={() => handleTabPress(tab)}
        className={
          isAuthButton
            ? isActive
              ? "bg-redscale-500 border-redscale-700 data-[hover=true]:border-redscale-700"
              : "border-redscale-700 data-[hover=true]:border-redscale-700"
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
                  ? "text-white text-md data-[hover=true]:text-redscale-500"
                  : "text-redscale-500 text-md data-[hover=true]:text-redscale-500"
                : isActive
                  ? "text-white text-md data-[hover=true]:text-indigoscale-700"
                  : "text-indigoscale-700 text-md data-[hover=true]:text-indigoscale-700"
            }
          >
            {tab.name}
          </ButtonText>
        )}
      </Button>
    );
  };

  // Calculate max height for mobile menu based on tab count
  const mobileMenuMaxHeight = tabs.length * 52 + 16; // each item ~52px + padding

  const interpolatedMaxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mobileMenuMaxHeight],
  });

  const interpolatedOpacity = animatedHeight.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <VStack style={{ zIndex: 50 }}>
      <HStack className="w-full justify-between items-center px-4 bg-white">
        <Pressable onPress={handleLogoPress}>
          <HStack>
            <Image
              size="lg"
              source={require("@/assets/logo.png")}
              alt="MWH Logo"
            />
            <VStack className="justify-center ml-2">
              <Heading className="text-2xl text-indigoscale-900" bold>
                MWH
              </Heading>
              <Text className="text-indigoscale-500" size={"sm"}>
                MWH Minimart
              </Text>
            </VStack>
          </HStack>
        </Pressable>

        {/* Desktop navigation */}
        {!isMobile && (
          <HStack space={"md"} className="items-center">
            {tabs
              .filter((tab) => tab.icon != null)
              .map((tab) => renderTabButton(tab, false))}
          </HStack>
        )}

        {/* Mobile hamburger button */}
        {isMobile && (
          <Pressable
            onPress={toggleMenu}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: menuOpen ? "#D9E0F2" : "transparent",
            }}
          >
            {menuOpen ? (
              <X size={24} color="#273C73" />
            ) : (
              <Menu size={24} color="#273C73" />
            )}
          </Pressable>
        )}
      </HStack>

      {/* Mobile dropdown menu */}
      {isMobile && (
        <Animated.View
          style={{
            maxHeight: interpolatedMaxHeight,
            opacity: interpolatedOpacity,
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            borderBottomWidth: menuOpen ? 1 : 0,
            borderBottomColor: "#D9E0F2",
          }}
        >
          <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            {tabs
              .filter((tab) => tab.icon != null)
              .map((tab) => renderTabButton(tab, true))}
          </View>
        </Animated.View>
      )}

      <Divider />
    </VStack>
  );
};

export default Header;
