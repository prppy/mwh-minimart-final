import React, { useState, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, Alert, Animated, Easing } from "react-native";
import {
  VStack,
  HStack,
  Box,
  ScrollView,
  Pressable,
  Button,
  ButtonText,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckIcon,
} from "@gluestack-ui/themed";
import Svg, { G, Path, Text as SvgText, Circle, Line } from "react-native-svg";
import { ADMIN_PURPLE, LIGHTEST_PURPLE } from "../../../constants/colors";
import SearchBar from "@/components/Searchbar";
import ProfileAvatar from "@/components/ProfileAvatar";
import { renderHighlightedText } from "@/utils/searchUtils";
import api from "@/components/utility/api";
import { User } from "@/constants/types";

interface WheelParticipant {
  id: string;
  name: string;
  profilePicture?: string;
}

// Generate random colors for the wheel segments
const generateWheelColors = (count: number): string[] => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2",
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// Custom Fortune Wheel Component
interface FortuneWheelProps {
  options: string[];
  colors: string[];
  onSpinEnd: (winner: string) => void;
  isSpinning: boolean;
  size?: number;
}

const FortuneWheel: React.FC<FortuneWheelProps> = ({
  options,
  colors,
  onSpinEnd,
  isSpinning,
  size = 500
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const [currentRotation, setCurrentRotation] = useState(0);
  
  const radius = size / 2;
  const center = radius;
  
  useEffect(() => {
    if (isSpinning) {
      // Generate random spin amount (3-7 full rotations plus random angle)
      const randomSpins = Math.random() * 4 + 3; // 3 to 7 spins
      const randomAngle = Math.random() * 360; // random final position
      const totalRotation = randomSpins * 360 + randomAngle;
      
      spinValue.setValue(0);
      
      Animated.timing(spinValue, {
        toValue: totalRotation,
        duration: 10000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        const finalAngle = (currentRotation + totalRotation) % 360;
        setCurrentRotation(finalAngle);
        
        // Calculate which segment the pointer is on
        const segmentAngle = 360 / options.length;
        // Adjust for pointer being at top (270 degrees in our coordinate system)
        const adjustedAngle = (360 - finalAngle + 270) % 360;
        const winnerIndex = Math.floor(adjustedAngle / segmentAngle);
        
        onSpinEnd(options[winnerIndex]);
      });
    }
  }, [isSpinning]);

  // Create wheel segments
  const createSegmentPath = (index: number, total: number): string => {
    if (total === 1) {
      // For single participant, create a full circle
      const outerRadius = radius - 20;
      return `M ${center} ${center} m -${outerRadius}, 0 a ${outerRadius},${outerRadius} 0 1,1 ${outerRadius * 2},0 a ${outerRadius},${outerRadius} 0 1,1 -${outerRadius * 2},0`;
    }
    
    const angle = (360 / total) * Math.PI / 180;
    const startAngle = index * angle;
    const endAngle = (index + 1) * angle;
    
    const x1 = center + Math.cos(startAngle) * (radius - 20);
    const y1 = center + Math.sin(startAngle) * (radius - 20);
    const x2 = center + Math.cos(endAngle) * (radius - 20);
    const y2 = center + Math.sin(endAngle) * (radius - 20);
    
    const largeArc = angle > Math.PI ? 1 : 0;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius - 20} ${radius - 20} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Calculate text position and rotation for each segment
  const getTextPosition = (index: number, total: number) => {
    if (total === 1) {
      // For single participant, center the text
      return { x: center, y: center, rotation: 0 };
    }
    
    const angle = (360 / total) * Math.PI / 180;
    const midAngle = (index + 0.5) * angle;
    const textRadius = radius * 0.7;
    
    const x = center + Math.cos(midAngle) * textRadius;
    const y = center + Math.sin(midAngle) * textRadius;
    const rotation = (midAngle * 180 / Math.PI + 90) % 360;
    
    return { x, y, rotation };
  };

  const animatedStyle = {
    transform: [
      {
        rotate: spinValue.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  if (options.length === 0) {
    return (
      <Box style={[styles.emptyWheel]}>
        <Text style={styles.emptyWheelText}>
          Select participants to see the wheel
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ alignItems: 'center', width: size, height: size }}>
      <Box style={{ position: 'relative', width: size, height: size }}>
        <Animated.View style={animatedStyle}>
          <Svg width={size} height={size}>
            {options.map((option, index) => {
              const segmentPath = createSegmentPath(index, options.length);
              const textPos = getTextPosition(index, options.length);
              
              return (
                <G key={index}>
                  <Path
                    d={segmentPath}
                    fill={colors[index]}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={textPos.x}
                    y={textPos.y}
                    fill="#000"
                    fontSize="12"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${textPos.rotation > 180 ? textPos.rotation + 180 : textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                  >
                    {option.length > 10 ? option.substring(0, 8) + '...' : option}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </Box>
    </Box>
  );
};

const AdminLottery: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Fetch users from API
  async function fetchUsers() {
    try {
      setLoading(true);
      const usersResponse = await api.get("users");
      const allUsers = usersResponse.data.data.users ?? [];
      const residents = allUsers.filter(
        (user: User) => user.userRole === "resident"
      );
      setUsers(residents);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (user.userName || "")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [searchText, users]);

  const wheelParticipants = useMemo<WheelParticipant[]>(() => {
    return Array.from(selectedUsers).map((userId) => {
      const user = users.find((u) => String(u.id) === userId);
      return {
        id: String(user?.id ?? ""),
        name: user?.userName || "Unknown",
        ...(user?.profilePicture ? { profilePicture: user.profilePicture } : {}),
      };
    });
  }, [selectedUsers, users]);

  const wheelOptions = wheelParticipants.map((p) => p.name);
  const wheelColors = generateWheelColors(wheelParticipants.length);

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    newSelected.has(userId)
      ? newSelected.delete(userId)
      : newSelected.add(userId);
    setSelectedUsers(newSelected);
    setWinner(null);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => String(u.id))));
    }
    setWinner(null);
  };

  const handleSpin = () => {
    if (wheelParticipants.length < 1) {
      Alert.alert("Error", "Please select at least 1 participant");
      return;
    }
    setSpinning(true);
    setWinner(null);
  };

  const handleSpinEnd = (winnerName: string) => {
    setSpinning(false);
    setWinner(winnerName);
    Alert.alert("🎉 Winner!", `Congratulations to ${winnerName}!`);
  };

  const renderUserItem = (user: User) => {
    const userId = String(user.id);
    const userName = user.userName || "Unknown";
    return (
      <Pressable
        key={userId}
        onPress={() => handleUserToggle(userId)}
        style={[
          styles.userItem,
          selectedUsers.has(userId) && styles.selectedUserItem,
        ]}
      >
        <HStack space="md" alignItems="center" flex={1}>
          <Checkbox
            value={userId}
            isChecked={selectedUsers.has(userId)}
            onChange={() => handleUserToggle(userId)}
            size="md"
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} color="white" />
            </CheckboxIndicator>
          </Checkbox>
          <ProfileAvatar
            source={user.profilePicture}
            borderColor="#8B5CF6"
            scale={0.7}
          />
          <VStack flex={1}>
            <Text style={styles.userName}>
              {renderHighlightedText(userName, searchText)}
            </Text>
            <Text style={styles.userDetails}>
              Points: {user.resident?.currentPoints ?? 0} | Batch:{" "}
              {user.resident?.batchNumber || "-"}
            </Text>
          </VStack>
        </HStack>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <HStack space="xl" flex={1}>
        {/* Left Side - Wheel */}
        <VStack flex={1} space="lg" alignItems="center">
          <Box style={styles.wheelContainer}>
            <FortuneWheel
              options={wheelOptions}
              colors={wheelColors}
              onSpinEnd={handleSpinEnd}
              isSpinning={spinning}
            />

            <VStack space="md" mt={20} alignItems="center">
              <Button
                onPress={handleSpin}
                disabled={spinning || wheelParticipants.length < 1}
                style={[
                  styles.spinButton,
                  (spinning || wheelParticipants.length < 1) &&
                    styles.disabledButton,
                ]}
              >
                <Text style={styles.spinButtonText}>
                  {spinning ? "Spinning..." : "Spin the Wheel!"}
                </Text>
              </Button>

              {winner && (
                <Box style={styles.winnerBox}>
                  <Text style={styles.winnerTitle}>🏆 Winner</Text>
                  <Text style={styles.winnerName}>{winner}</Text>
                </Box>
              )}

              <Text style={styles.participantCount}>
                Participants: {wheelParticipants.length}
              </Text>
            </VStack>
          </Box>
        </VStack>

        {/* Right Side - User Selection */}
        <VStack flex={1} space="lg">
          <Box style={styles.selectionContainer}>
            <HStack justifyContent="space-between" alignItems="center" mb={2}>
              <Text style={styles.sectionTitle}>Select Participants</Text>
              <Button onPress={handleSelectAll} variant="outline" size="sm">
                <ButtonText>
                  {selectedUsers.size === filteredUsers.length
                    ? "Deselect All"
                    : "Select All"}
                </ButtonText>
              </Button>
            </HStack>

            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search residents..."
              sx={{ marginBottom: 16 }}
            />

            <ScrollView style={styles.userList} showsVerticalScrollIndicator>
              {loading ? (
                <Box style={styles.loadingContainer}>
                  <Text>Loading users...</Text>
                </Box>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(renderUserItem)
              ) : (
                <Box style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No residents found</Text>
                </Box>
              )}
            </ScrollView>

            {selectedUsers.size > 0 && (
              <Box style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryText}>
                  {selectedUsers.size} participant
                  {selectedUsers.size !== 1 ? "s" : ""} selected
                </Text>
              </Box>
            )}
          </Box>
        </VStack>
      </HStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_PURPLE,
    padding: 30,
  },
  wheelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 500,
  },
  selectionContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    height: 600,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  emptyWheel: {
    width: 450,
    height: 450,
    borderRadius: 250,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#DDD",
    borderStyle: "dashed",
  },
  emptyWheelText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  spinButton: {
    backgroundColor: "#FF6B35",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  spinButtonText: {
    fontSize: 18,
    color: "black",
    lineHeight: 22,
  },
  winnerBox: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  winnerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  participantCount: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  userList: {
    flex: 1,
    maxHeight: 400,
  },
  userItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedUserItem: {
    backgroundColor: LIGHTEST_PURPLE,
    borderColor: "#8B5CF6",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  selectedSummary: {
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  selectedSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    textAlign: "center",
  },
});

export default AdminLottery;