import React, { useState } from "react";
import {
  StyleSheet,
  Image,
  FlatList,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Box } from "@gluestack-ui/themed";
import { MaterialIcons } from "@expo/vector-icons";

// functions
import { hslToHSLA } from "@/utils/styleUtils";
import { setHSLlightness } from "@/utils/styleUtils";

const styleBgMappings: Record<string, any> = {
  "🌳": require("../../assets/background/nature.png"),
  "🏀": require("../../assets/background/sports.png"),
  "🎨": require("../../assets/background/art.png"),
  "🎮": require("../../assets/background/games.png"),
  "📖": require("../../assets/background/education.png"),
};

const colorOptions: string[] = [
  "hsl(9, 67%, 50%)",
  "hsl(25, 100%, 50%)",
  "hsl(55, 67%, 50%)",
  "hsl(101, 67%, 50%)",
  "hsl(208, 79%, 50%)",
  "hsl(2, 67%, 50%)",
  "hsl(223, 49%, 50%)",
];

// 🧪 Sample resident data
const residents = [
  {
    name: "Resident Name #1",
    profilePic: null,
    points: 4000,
    style: "🎨",
    color: "hsl(55, 67%, 50%)",
  },
  {
    name: "Resident Name #2",
    profilePic: null, // no profile picture
    points: 4000,
    style: "🎮",
    color: "hsl(208, 79%, 50%)",
  },
  {
    name: "Resident Name #3",
    profilePic: null,
    points: 4000,
    style: "📖",
    color: "hsl(101, 67%, 50%)",
  },
  {
    name: "Resident Name #4",
    profilePic: null,
    points: 4000,
    style: "🌳",
    color: "hsl(2, 67%, 50%)",
  },
  {
    name: "Resident Name #5",
    profilePic: null,
    points: 4000,
    style: "📖",
    color: "hsl(223, 49%, 50%)",
  },
  {
    name: "Resident Name #5",
    profilePic: null,
    points: 4000,
    style: "📖",
    color: "hsl(223, 49%, 50%)",
  },
];

// define the Resident type
type Resident = {
  name: string;
  profilePic: any | null; // can refine to ImageSourcePropType if needed
  points: number;
  style: string;
  color: string;
};

// add type to LeaderboardCard props
const LeaderboardCard: React.FC<{ resident: Resident }> = ({ resident }) => {
  return (
    <Box style={[styles.cardContainer]} bg={hslToHSLA(resident.color, 0.5)}>
      <ImageBackground
        source={styleBgMappings[resident.style]}
        style={styles.cardBackground}
        imageStyle={styles.bgImage}
        resizeMode="cover"
      >
        <Box style={styles.cardContent}>
          {resident.profilePic ? (
            <Image
              source={resident.profilePic}
              style={[styles.profilePic, { borderColor: resident.color }]}
            />
          ) : (
            <Box style={[styles.profilePic, { borderColor: resident.color }]} />
          )}
          <Box style={[styles.coloredBar, { backgroundColor: resident.color }]}>
            <Text style={styles.cardText}>{resident.name}</Text>
            <Text style={styles.cardText}>{resident.points}pts</Text>
          </Box>
        </Box>
      </ImageBackground>
    </Box>
  );
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// main Page
const LeaderboardPage: React.FC = () => {
  const [monthIndex, setMonthIndex] = useState(5); // June is index 5 (0-based)

  const prevMonth = () => {
    setMonthIndex((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const nextMonth = () => {
    setMonthIndex((prev) => (prev === 11 ? 0 : prev + 1));
  };
  return (
    <Box style={styles.container}>
      <Box style={styles.leaderboardBox}>
        <Box style={styles.monthHeader}>
          <MaterialIcons
            name="arrow-back-ios"
            size={28}
            color="#333"
            onPress={prevMonth}
          />

          <Text style={styles.monthText}>{MONTHS[monthIndex]}</Text>

          <MaterialIcons
            name="arrow-forward-ios"
            size={28}
            color="#333"
            onPress={nextMonth}
          />
        </Box>

        <FlatList
          data={residents}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <LeaderboardCard resident={item} />}

          // FlatList scrolls automatically when content exceeds container height
        />
      </Box>
    </Box>
  );
};

export default LeaderboardPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 30, // add padding if you want space around leaderboardBox
  },
  leaderboardBox: {
    flex: 1, // fill container vertically
    borderRadius: 12,
    backgroundColor: "white",

    // shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  list: {
    paddingVertical: 20,
    marginHorizontal: 25,
  },

  cardContainer: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
    height: 120,
  },

  cardBackground: {
    width: "100%",
    flex: 1,
  },

  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  coloredBar: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: "50%",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderRadius: 15,
    marginLeft: 20,
  },

  bgImage: {
    opacity: 0.6, // increase for more visibility,
    transform: [{ translateY: -34 }, { scale: 1 }],
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    borderWidth: 5,
    marginRight: 12,
    backgroundColor: "#D9D9D9",
  },

  cardText: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  monthHeader: {
    height: 65,
    borderBottomColor: "#d9d9d9",
    borderBottomWidth: 1,
    marginHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
});
