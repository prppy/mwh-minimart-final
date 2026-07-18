import { ColorSwatch, Selector, StyleIcon } from "@/components/custom-selector";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/auth-context";
import api from "@/utils/api";
import { Resident } from "@/utils/types";
import { useRouter } from "expo-router";
import * as lucide from "lucide-react-native";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";

const MOBILE_BREAKPOINT = 768;

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [resident, setResident] = useState<Resident>();
  const [rank, setRank] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  // helper methods:
  const mapResident = (data: any): Resident => {
    const r = data.resident || {};
    return {
      id: data.id,
      userName: data.userName,
      userRole: "resident",
      profilePicture: data.profilePicture ?? undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date(data.updatedAt),
      batchNumber: r.batchNumber || 0,
      currentPoints: r.currentPoints || 0,
      totalPoints: r.totalPoints || 0,
      dateOfAdmission: r.dateOfAdmission
        ? new Date(r.dateOfAdmission)
        : new Date(),
      dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : new Date(),
      lastAbscondence: r.lastAbscondence,
      backgroundType: r.Wallpaper_Theme ?? r.backgroundType ?? "sports",
      wallpaperType: r.Wallpaper_Colour ?? r.wallpaperType ?? "red",
    };
  };

  const updateResident = async (payload: object) => {
    if (!user) return;
    const res = await api.put(`users/${user.id}`, { resident: payload });
    setResident(mapResident(res.data.data));
  };

  useEffect(() => {
    // Only navigate if router is ready to prevent "navigate before mounting" error
    if (!isAuthenticated || !user) {
      const timer = setTimeout(() => {
        router.replace("/(public)/catalogue");
      }, 0);
      return () => clearTimeout(timer);
    }

    (async () => {
      try {
        const [userRes, rankRes] = await Promise.all([
          api.get(`users/${user.id}`),
          api.get(`leaderboard/user/${user.id}/position`),
        ]);
        setResident(mapResident(userRes.data.data));
        if (rankRes.data?.success && rankRes.data?.data) {
          setRank(rankRes.data.data.position);
        }
      } catch (err) {
        console.log("Failed to fetch resident or position", err);
      }
    })();
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || !resident) {
    return (
      <VStack className="justify-center items-center flex-1">
        <Text>Redirecting...</Text>
      </VStack>
    );
  }

  const wallpaperType = resident.wallpaperType || "red";
  const backgroundType = resident.backgroundType || "sports";

  const regular = `${wallpaperType}scale-500`;
  const dark = `${wallpaperType}scale-700`;
  const darkText = `text-${dark}`;

  const colorOptions = ["red", "orange", "yellow", "green", "blue", "purple"];

  // TODO: update more themes?
  const styleOptions = ["sports", "arts", "education", "nature", "games"];

  const backgroundImages: Record<string, any> = {
    sports: require("@/assets/background/neat/sports.png"),
    arts: require("@/assets/background/neat/art.png"),
    education: require("@/assets/background/neat/education.png"),
    nature: require("@/assets/background/neat/nature.png"),
    games: require("@/assets/background/neat/games.png"),
  };

  const icons: Record<string, lucide.LucideIcon> = {
    sports: lucide.Volleyball,
    arts: lucide.Palette,
    education: lucide.BookText,
    nature: lucide.TreeDeciduous,
    games: lucide.Gamepad2,
  };

  return (
    <Box className={`flex-1 bg-${wallpaperType}scale-300 relative`}>
      <Image
        source={backgroundImages[backgroundType]}
        className="w-full h-full opacity-100 absolute"
        resizeMode="cover"
        alt="profile-background"
      />
      <View style={{
        flex: 1,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 80,
        padding: isMobile ? 16 : 80,
        zIndex: 10,
        position: 'relative' as const,
        alignItems: isMobile ? 'center' : 'flex-start',
      }}>
        <Avatar className={`border-${isMobile ? '4' : '8'} ${isMobile ? 'w-32 h-32' : 'w-96 h-96'} border-${regular} bg-${dark}`}>
          <AvatarFallbackText className="text-3xl ">
            {resident.userName}
          </AvatarFallbackText>
          <AvatarImage source={{ uri: resident.profilePicture }} />
        </Avatar>
        <VStack className="flex-1 gap-3">
          <VStack className={`w-full bg-${regular} rounded-lg p-4 gap-1`}>
            <Heading size={isMobile ? "2xl" : "4xl"} className="text-white">
              {resident.userName}
            </Heading>
            <Heading size={isMobile ? "lg" : "2xl"} className="text-white">
              {rank !== null
                ? `You are #${rank} on the Leaderboard!`
                : "Loading rank..."}
            </Heading>
            <Heading
              size={isMobile ? "lg" : "2xl"}
              className="text-white"
            >{`You have ${resident.totalPoints} points`}</Heading>
          </VStack>
          <View style={{ flexDirection: isMobile ? "column" : "row", width: "100%", gap: isMobile ? 8 : 12 }}>
            {/* colour selectors */}
            <Selector title="Colour" colorTheme={darkText}>
              {colorOptions.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={c === wallpaperType}
                  onPress={() => updateResident({ wallpaperType: c })}
                />
              ))}
            </Selector>
            {/* theme selectors */}
            <Selector title="Theme" colorTheme={darkText}>
              {styleOptions.map((t) => (
                <StyleIcon
                  key={t}
                  icon={icons[t]}
                  color={dark}
                  selected={t === backgroundType}
                  onPress={() => updateResident({ backgroundType: t })}
                />
              ))}
            </Selector>
          </View>
          {/* TODO: recent transactions */}
          <HStack className="w-full gap-2 p-5 justify-between items-center bg-white rounded-lg">
            <Heading className={darkText}>Your Recent Transactions</Heading>
            <Icon as={lucide.ChevronDown} size="xl" className={darkText} />
          </HStack>
        </VStack>
      </View>
    </Box>
  );
};

export default ProfilePage;
