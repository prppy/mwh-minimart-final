import React, { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Pressable,
} from "@gluestack-ui/themed";
import { ActivityIndicator } from "react-native";
import { ImageSourcePropType, StyleSheet } from "react-native";

// helper functions
const hslToHSLA = (hsl: string, alpha: number): string =>
  hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);

const setHSLlightness = (hsl: string, newLightness: number): string => {
  const parts = hsl.split(",");
  parts[2] = ` ${Math.max(0, Math.min(100, newLightness)).toFixed(1)}%)`;
  return parts.join(",");
};

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
      width: 50,
      height: 50,
      borderRadius: 25,
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
      width: 50,
      height: 50,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: selected ? 3 : 1,
      borderColor: selected ? "#131E39" : "#ccc",
    }}
  >
    <Text fontSize={40}>{icon}</Text>
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

  return (
    <Box flex={1} bg={hslToHSLA(colorTheme, 0.5)}>
      {/* Background Image */}
      <Image
        source={styleBgMappings[style]}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        alt={`${style} background wallpaper`}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        opacity={0.55}
      />

      {/* Loading Spinner */}
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          bg="transparent"
          zIndex={10}
        >
          <ActivityIndicator size="large" color="#fff" />
        </Box>
      )}

      {/* Profile Content */}
      <Box flex={1} p="$20">
        <HStack space="2xl" alignItems="center" p="$4">
          {/* Profile Picture */}
          <Box
            borderRadius="$full"
            overflow="hidden"
            borderWidth={5}
            borderColor={colorTheme}
            backgroundColor="white"
          >
            <Image
              source={{ uri: "placeholder" }}
              alt="Profile Picture"
              width={300}
              height={300}
            />
          </Box>

          {/* Profile Info */}
          <VStack flex={1} space="lg" marginLeft={100}>
            <Text
              style={[styles.name, { color: setHSLlightness(colorTheme, 25) }]}
            >
              Resident Name
            </Text>
            <Text
              style={[
                styles.detailsLabel,
                { color: setHSLlightness(colorTheme, 25) },
              ]}
            >
              Leaderboard: {leaderboard}
            </Text>
            <Text
              style={[
                styles.detailsLabel,
                { color: setHSLlightness(colorTheme, 25) },
              ]}
            >
              Points: {points} pts
            </Text>

            {/* Color + Style Selectors */}
            <HStack space="lg">
              <Selector title="Colour" colorTheme={colorTheme}>
                {colorOptions.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color}
                    selected={colorTheme === color}
                    onPress={() => setColorTheme(color)}
                  />
                ))}
              </Selector>

              <Selector title="Style" colorTheme={colorTheme}>
                {styleOptions.map((icon) => (
                  <StyleIcon
                    key={icon}
                    icon={icon}
                    selected={style === icon}
                    onPress={() => setStyle(icon)}
                  />
                ))}
              </Selector>
            </HStack>

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
    </Box>
  );
};

export default Profile;

// styles
const styles = StyleSheet.create({
  name: {
    fontWeight: "bold",
    fontSize: 50,
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
