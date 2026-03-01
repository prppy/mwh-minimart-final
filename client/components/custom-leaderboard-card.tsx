import { Avatar, AvatarFallbackText, AvatarImage } from "./ui/avatar";
import { HStack } from "./ui/hstack";
import { Text } from "./ui/text";
import { Box } from "./ui/box";
import { Image } from "./ui/image";

type LeaderboardCardProps = {
  name: string;
  points: number;
  profilePicture?: string;
  background?: string;
  wallpaperColour?: string;
};

const themes: Record<string, any> = {
  arts: require("@/assets/background/art.png"),
  education: require("@/assets/background/education.png"),
  games: require("@/assets/background/games.png"),
  nature: require("@/assets/background/nature.png"),
  sports: require("@/assets/background/sports.png"),
};

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  name,
  points,
  profilePicture,
  background = "sports",
  wallpaperColour = "indigo",
}) => {
  const lightColourClass = wallpaperColour + "scale-300";
  const regularColourClass = wallpaperColour + "scale-500";
  const darkColourClass = wallpaperColour + "scale-700";
  const bgSource = themes[background];

  return (
    <Box
      className={`w-full bg-${lightColourClass} rounded-xl overflow-hidden relative`}
    >
      <Image
        source={bgSource}
        className="w-full h-[175%] opacity-50 absolute"
        resizeMode="cover"
        alt="wallpaper"
      />
      <HStack className="w-full p-5 rounded-xl" space="xl">
        <Avatar
          size="lg"
          className={`border-2 border-${regularColourClass} bg-${darkColourClass}`}
        >
          <AvatarFallbackText>{name}</AvatarFallbackText>
          <AvatarImage source={{ uri: profilePicture }} />
        </Avatar>

        <HStack
          className={`flex-1 bg-${regularColourClass} items-center justify-between p-3 rounded-lg`}
        >
          <Text size="lg" className="text-white" bold>{name}</Text>
          <Text size="lg" className="text-white">{points}pts</Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default LeaderboardCard;
