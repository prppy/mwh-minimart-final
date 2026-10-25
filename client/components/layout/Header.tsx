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
  Receipt,
  ClipboardList,
  Settings,
} from "lucide-react-native";
import BrandLogo from "../brand-logo";
import AwningStripe from "./AwningStripe";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { Text } from "../ui/text";
import {
  useWindowDimensions,
  Animated,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useState, useRef, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;
const NAVY = "#1f3a93";
const INK = "#1c2340";
const ORANGE = "#e8502a";

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

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
        { name: "My Orders", route: "/(resident)/my-orders", icon: Receipt },
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
        { name: "Orders", route: "/(admin)/orders", icon: ClipboardList },
        { name: "Vouchers", route: "/(admin)/voucher-management", icon: TicketCheck },
        { name: "Users", route: "/(admin)/users", icon: Users },
        { name: "Feedback", route: "/(admin)/feedback", icon: MessageSquare },
        { name: "Spin & Win", route: "/(admin)/lottery", icon: Trophy },
        { name: "Screensaver", route: "/(admin)/screensaver", icon: Monitor },
        { name: "Settings", route: "/(admin)/settings", icon: Settings },
        { name: "Sign Out", route: "/", icon: LogOut, action: "logout" },
      ];
    }
    return [];
  };

  const tabs = getTabs();
  // "/" is the public landing page, but for signed-in staff it is the dashboard
  const isLanding = !user && normalizePath(pathname) === "";
  // Show icon-only tabs when the labels wouldn't fit next to the logo
  const isCompact = width < (tabs.length > 7 ? 1400 : 1100);
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
      router.replace("/login");
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

    // Sign In / Sign Out keep black text on a light fill so the label is
    // always readable; the active page tab is filled navy.
    const fill = (hovered: boolean) =>
      isAuthButton
        ? hovered || isActive
          ? "#FDE3DB"
          : "#FFFFFF"
        : isActive
          ? NAVY
          : hovered
            ? "#EEF1F8"
            : "transparent";
    const ink = isAuthButton ? "#000000" : isActive ? "#FFFFFF" : INK;

    return (
      <Pressable
        key={tab.name}
        onPress={() => handleTabPress(tab)}
        accessibilityRole="link"
        accessibilityLabel={tab.name}
        accessibilityState={{ selected: isActive }}
      >
        {({ hovered }: any) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: isMobileMenu ? 12 : 8,
              paddingVertical: isMobileMenu ? 12 : 8,
              paddingHorizontal: isMobileMenu ? 16 : isCompact ? 10 : 14,
              borderRadius: isMobileMenu ? 10 : 999,
              backgroundColor: fill(!!hovered),
              borderWidth: isAuthButton ? 1.5 : 0,
              borderColor: ORANGE,
            }}
          >
            <IconComponent size={isMobileMenu ? 20 : 17} color={isAuthButton ? ORANGE : ink} />
            {(isMobileMenu || !isCompact) && (
              <Text style={{ color: ink, fontSize: 15, fontWeight: isActive || isAuthButton ? "700" : "500" }}>
                {tab.name}
              </Text>
            )}
          </View>
        )}
      </Pressable>
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
        {isLanding ? (
          // Keeps the header height; the landing page shows the big logo itself
          <View style={{ height: (isMobile ? 170 : 220) / (470 / 120) + 16 }} />
        ) : (
          <Pressable onPress={handleLogoPress} style={{ paddingVertical: 8 }}>
            <BrandLogo width={isMobile ? 170 : 220} />
          </Pressable>
        )}

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

      <AwningStripe />
    </VStack>
  );
};

export default Header;