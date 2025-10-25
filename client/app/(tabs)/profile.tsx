import React, { useState, useEffect } from "react";
import { ImageSourcePropType, StyleSheet } from "react-native";
import { ImageBackground, ActivityIndicator } from "react-native";
import {
  Box,
  HStack,
  VStack,
  Text,
  Image as GSImage,
  Pressable,
  ScrollView,
  Button,
  ButtonText,
} from "@gluestack-ui/themed";
import { Resident } from "@/constants/types";
import api from "@/components/utility/api";
import { hslToHSLA } from "@/utils/styleUtils";
import { setHSLlightness } from "@/utils/styleUtils";
import AIImageGenerator from "@/components/AIImageGenerator";
// helper functions

// ColorSwatch component props
type ColorSwatchProps = {
  color: string;
  selected: boolean;
  onPress: () => void;
};

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: color,
      borderWidth: selected ? 3 : 1,
      borderColor: selected ? "#D9E0F2" : "#ccc",
    }}
  />
);

// StyleIcon component props
type StyleIconProps = {
  icon: string;
  selected: boolean;
  onPress: () => void;
};

const StyleIcon: React.FC<StyleIconProps> = ({ icon, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: selected ? 3 : 1,
      borderColor: selected ? "#131E39" : "#ccc",
    }}
  >
    <Text fontSize={30}>{icon}</Text>
  </Pressable>
);

// Selector component props
type SelectorProps = {
  title: string;
  children: React.ReactNode;
  colorTheme: string;
};

const Selector: React.FC<SelectorProps> = ({ title, children, colorTheme }) => (
  <Box borderRadius="$md" bg="$white" style={styles.selectorCard} flex={1}>
    <VStack space="sm">
      <HStack alignItems="center" space="md">
        <Text style={[styles.detailsLabel, { color: colorTheme }]}>
          {title}
        </Text>
      </HStack>
      <HStack space="lg" flexWrap="wrap">
        {children}
      </HStack>
    </VStack>
  </Box>
);

const Profile: React.FC = () => {
  const [leaderboard] = useState<number>(-1);
  const [points] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [colorTheme, setColorTheme] = useState<string>("hsl(9, 67%, 50%)");
  const [style, setStyle] = useState<string>("🎮");
  const [user, setUser] = useState<Resident | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState<boolean>(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const colorOptions: string[] = [
    "hsl(9, 67%, 50%)",
    "hsl(25, 100%, 50%)",
    "hsl(55, 67%, 50%)",
    "hsl(101, 67%, 50%)",
    "hsl(208, 79%, 50%)",
    "hsl(2, 67%, 50%)",
    "hsl(223, 49%, 50%)",
  ];

  const styleOptions: string[] = ["🌳", "🏀", "🎨", "🎮", "📖"];

  const styleBgMappings: Record<string, ImageSourcePropType> = {
    "🌳": require("../../assets/background/nature.png"),
    "🏀": require("../../assets/background/sports.png"),
    "🎨": require("../../assets/background/art.png"),
    "🎮": require("../../assets/background/games.png"),
    "📖": require("../../assets/background/education.png"),
  };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500); // or 1000ms

    return () => clearTimeout(timeout);
  }, [style]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("users/me"); // PLACEHOLDER
        const data = response.data.data;
        console.log(data);

        const resident = new Resident({
          id: data.userId,
          name: data.userName,
          profilePic: data.profilePicture,
          points: data.currentPoints,
          leaderboard: data.rank,
          colorTheme: data.colorTheme,
          style: data.style,
        });

        setUser(resident);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  const handleSetColorTheme = (newColor: string) => {
    setColorTheme(newColor);
    // in future: send to backend
    // e.g. updateUserPreference({ colorTheme: newColor });
  };

  const handleSetStyle = (newStyle: string) => {
    setStyle(newStyle);
    // nm bvdfq `q1wdsefin future: send to backend
    // e.g. updateUserPreference({ style: newStyle });
  };

  const handleImageGenerated = (imageUrl: string) => {
    console.log("Image generated:", imageUrl);
  };

  const handleImageAccepted = async (imageUrl: string) => {
    try {
      // Upload to Supabase and update user profile
      const userId = user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await api.post("images/upload", {
        imageUrl,
        userId,
      });

      const supabaseUrl = response.data.data.url;

      // Update user profile with the new image URL
      await api.put(`users/${userId}`, {
        profilePicture: supabaseUrl,
      });

      setProfileImageUrl(supabaseUrl);
      setShowAIGenerator(false);
    } catch (error) {
      console.error("Failed to save image:", error);
      throw error;
    }
  };

  // TODO: need to save and update the user's bg choices
  return (
    <ScrollView flex={1} bg={hslToHSLA(colorTheme, 0.5)}>
      {/* Background Image */}
      <ImageBackground
        source={styleBgMappings[style]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          opacity: 0.55,
        }}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {/* Profile Content */}
      <Box flex={1} p={28}>
        <HStack space="2xl" alignItems="center" p="$4">
          {/* Profile Picture */}
          <VStack space="md">
            <Box
              borderRadius="$full"
              overflow="hidden"
              borderWidth={5}
              borderColor={colorTheme}
              backgroundColor="white"
            >
              <GSImage
                source={{ uri: profileImageUrl || user?.profilePic || "placeholder" }}
                alt="Profile Picture"
                width={300}
                height={300}
              />
            </Box>
            
            <Button
              onPress={() => setShowAIGenerator(!showAIGenerator)}
              variant={showAIGenerator ? "outline" : "solid"}
              size="sm"
            >
              <ButtonText>
                {showAIGenerator ? "Cancel" : "Generate AI Profile Picture"}
              </ButtonText>
            </Button>
          </VStack>

          {/* Profile Info */}
          <VStack flex={1} space="lg" marginLeft={100}>
            <Text
              style={[styles.name, { color: setHSLlightness(colorTheme, 25) }]}
            >
              {user?.name || "Resident's Name"}
            </Text>
            <Text
              style={[
                styles.detailsLabel,
                { color: setHSLlightness(colorTheme, 25) },
              ]}
            >
              Leaderboard: {user?.leaderboard || "placeholder"}
            </Text>
            <Text
              style={[
                styles.detailsLabel,
                { color: setHSLlightness(colorTheme, 25) },
              ]}
            >
              Points: {user?.points} pts
            </Text>

            {/* Color + Style Selectors */}
            <HStack space="lg">
              <Selector title="Colour" colorTheme={colorTheme}>
                {colorOptions.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color}
                    selected={colorTheme === color}
                    onPress={() => handleSetColorTheme(color)}
                  />
                ))}
              </Selector>

              <Selector title="Style" colorTheme={colorTheme}>
                {styleOptions.map((icon) => (
                  <StyleIcon
                    key={icon}
                    icon={icon}
                    selected={style === icon}
                    onPress={() => handleSetStyle(icon)}
                  />
                ))}
              </Selector>
            </HStack>

            {/* AI Image Generator */}
            {showAIGenerator && (
              <AIImageGenerator
                onImageGenerated={handleImageGenerated}
                onImageAccepted={handleImageAccepted}
                borderColor={colorTheme}
                size={300}
              />
            )}

            {/* Recent Transactions */}
            <Box style={styles.selectorCard}>
              <Text
                style={[
                  styles.detailsLabel,
                  { color: setHSLlightness(colorTheme, 25) },
                ]}
              >
                Recent Transactions
              </Text>
            </Box>
          </VStack>
        </HStack>
      </Box>
    </ScrollView>
  );
};

export default Profile;

// styles
const styles = StyleSheet.create({
  name: {
    fontWeight: "bold",
    fontSize: 45,
  },
  detailsLabel: {
    fontWeight: "500",
    fontSize: 30,
    marginBottom: 5,
  },
  selectorCard: {
    borderRadius: 15,
    backgroundColor: "white",
    padding: 20,
  },
});
