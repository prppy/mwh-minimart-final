import { ColorSwatch, Selector, StyleIcon } from "@/components/custom-selector";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { ImageBackground } from "@/components/ui/image-background";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/auth-context";
import api from "@/utils/api";
import { Resident } from "@/utils/types";
import { useRouter } from "expo-router";
import * as lucide from "lucide-react-native";
import { useEffect, useState } from "react";

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [resident, setResident] = useState<Resident>();
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // helper methods:
  const mapResident = (data: any): Resident => {
    const r = data.resident;
    return {
      id: data.id,
      userName: data.userName,
      userRole: "resident",
      profilePicture: data.profilePicture ?? undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date(data.updatedAt),
      batchNumber: r.batchNumber,
      currentPoints: r.currentPoints,
      totalPoints: r.totalPoints,
      dateOfAdmission: r.dateOfAdmission
        ? new Date(r.dateOfAdmission)
        : new Date(),
      dateOfBirth: new Date(r.dateOfBirth),
      lastAbscondence: r.lastAbscondence,
      backgroundType: r.Wallpaper_Theme,
      wallpaperType: r.Wallpaper_Colour,
    };
  };

  const updateResident = async (payload: object) => {
    if (!user) return;
    const res = await api.put(`users/${user.id}`, { resident: payload });
    setResident(mapResident(res.data.data));
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/(public)/catalogue");
      return;
    }

    (async () => {
      try {
        const res = await api.get(`users/${user.id}`);
        setResident(mapResident(res.data.data));
      } catch (err) {
        console.log("Failed to fetch resident", err);
      }
    })();
  }, [isAuthenticated, router, user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let logoutTimeout: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const warningTimeout = setTimeout(() => {
      setShowExpiryModal(true);
      setCountdown(10);

      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 50 * 1000);

    logoutTimeout = setTimeout(async () => {
      clearInterval(countdownInterval);
      await logout();
      router.replace("/(public)/catalogue");
    }, 60 * 1000);

    return () => {
      clearTimeout(warningTimeout);
      clearTimeout(logoutTimeout);
      clearInterval(countdownInterval);
    };
  }, [isAuthenticated, logout, router]);

  if (!isAuthenticated || !resident) {
    return (
      <VStack className="justify-center items-center flex-1">
        <Text>Redirecting...</Text>
      </VStack>
    );
  }

  const regular = `${resident.wallpaperType}scale-500`;
  const dark = `${resident.wallpaperType}scale-700`;
  const darkText = `text-${dark}`;

  const colorOptions = ["red", "orange", "yellow", "green", "blue", "purple"];

  // TODO: update more themes?
  const styleOptions = [
    "sports",
    "arts",
    "education",
    // "nature",
    // "games"
  ];

  const backgrounds: Record<string, any> = {
    sports: require("@/assets/background/sports.png"),
    arts: require("@/assets/background/art.png"),
    education: require("@/assets/background/education.png"),
    // games: require("@/assets/background/games.png"),
    // nature: require("@/assets/background/nature.png"),
  };

  const icons: Record<string, lucide.LucideIcon> = {
    sports: lucide.Volleyball,
    arts: lucide.Palette,
    education: lucide.BookText,
  };

  return (
    <VStack className={`flex-1 bg-${resident.wallpaperType}scale-300`}>
      <ImageBackground
        className="flex-1 flex-row gap-20 p-20"
        source={backgrounds[resident.backgroundType]}
        imageStyle={{ opacity: 0.3 }}
      >
        <Avatar className={`border-8 w-96 h-96 border-${regular} bg-${dark}`}>
          <AvatarFallbackText className="text-3xl ">
            {resident.userName}
          </AvatarFallbackText>
          <AvatarImage source={{ uri: resident.profilePicture }} />
        </Avatar>
        <VStack className="flex-1 gap-3">
          <Heading size="4xl" underline className={darkText}>
            {resident.userName}
          </Heading>
          <Heading size="2xl" className={darkText}>
            Leaderboard: #1
          </Heading>
          <Heading
            size="2xl"
            className={darkText}
          >{`Points: ${resident.totalPoints}pts`}</Heading>
          <HStack className="w-full" space="md">
            {/* colour selectors */}
            <Selector title="Colour" colorTheme={darkText}>
              {colorOptions.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={c === resident.wallpaperType}
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
                  selected={t === resident.backgroundType}
                  onPress={() => updateResident({ backgroundType: t })}
                />
              ))}
            </Selector>
          </HStack>
          {/* TODO: recent transactions */}
          <HStack className="w-full gap-2 p-5 justify-between items-center bg-white rounded-lg">
            <Heading className={darkText}>Recent Transactions</Heading>
            <Icon as={lucide.ChevronDown} size="xl" className={darkText} />
          </HStack>
        </VStack>
      </ImageBackground>
      {/* TODO: expiry modal */}
      {showExpiryModal && (
        <VStack className="absolute inset-0 justify-center items-center bg-black/60">
          <VStack className="bg-white p-8 rounded-lg items-center gap-4">
            <Heading size="lg">Session Expiring</Heading>
            <Text size="lg">You will be logged out in {countdown} seconds</Text>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
};

export default ProfilePage;
