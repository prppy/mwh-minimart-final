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
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentPointerName, setCurrentPointerName] = useState<string>("");
  const currentSpinValue = useRef(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationAnimations = useRef<Animated.Value[]>([]);
  
  const radius = size / 2;
  const center = radius;

  // Define helper functions before useMemo
  const createSegmentPath = (index: number, total: number, rad: number, cen: number): string => {
    if (total === 1) {
      const outerRadius = rad - 20;
      return `M ${cen} ${cen} m -${outerRadius}, 0 a ${outerRadius},${outerRadius} 0 1,1 ${outerRadius * 2},0 a ${outerRadius},${outerRadius} 0 1,1 -${outerRadius * 2},0`;
    }
    
    const angle = (360 / total) * Math.PI / 180;
    const startAngle = index * angle;
    const endAngle = (index + 1) * angle;
    
    const x1 = cen + Math.cos(startAngle) * (rad - 20);
    const y1 = cen + Math.sin(startAngle) * (rad - 20);
    const x2 = cen + Math.cos(endAngle) * (rad - 20);
    const y2 = cen + Math.sin(endAngle) * (rad - 20);
    
    const largeArc = angle > Math.PI ? 1 : 0;
    
    return `M ${cen} ${cen} L ${x1} ${y1} A ${rad - 20} ${rad - 20} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const getTextPosition = (index: number, total: number, rad: number, cen: number) => {
    if (total === 1) {
      return { x: cen, y: cen, rotation: 0 };
    }
    
    const angle = (360 / total) * Math.PI / 180;
    const midAngle = (index + 0.5) * angle;
    const textRadius = rad * 0.7;
    
    const x = cen + Math.cos(midAngle) * textRadius;
    const y = cen + Math.sin(midAngle) * textRadius;
    const rotation = (midAngle * 180 / Math.PI + 90) % 360;
    
    return { x, y, rotation };
  };

  // Memoize segment paths and text positions to avoid recalculating on every render
  const segments = useMemo(() => {
    return options.map((option, index) => ({
      option,
      path: createSegmentPath(index, options.length, radius, center),
      textPos: getTextPosition(index, options.length, radius, center)
    }));
  }, [options.length, radius, center]);

  // Create confetti particles
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      animValue: new Animated.Value(0),
      x: Math.random() * size,
      y: -20 - Math.random() * 100,
      rotation: Math.random() * 360,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#F8C471'][Math.floor(Math.random() * 6)],
      size: 8 + Math.random() * 8,
      delay: Math.random() * 500,
    }));
  }, [size]);

  // Start celebration animation
  const startCelebration = () => {
    setShowCelebration(true);
    
    confettiParticles.forEach((particle) => {
      particle.animValue.setValue(0);
      Animated.timing(particle.animValue, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000,
        delay: particle.delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3500);
  };
  
  useEffect(() => {
    if (isSpinning) {
      // Generate random spin amount (3-7 full rotations plus random angle)
      const randomSpins = Math.random() * 4 + 3; // 3 to 7 spins
      const randomAngle = Math.random() * 360; // random final position
      const totalRotation = randomSpins * 360 + randomAngle;
      
      spinValue.setValue(0);
      arrowBounce.setValue(0);
      currentSpinValue.current = 0;
      
      // Track spin value changes
      const listenerId = spinValue.addListener(({ value }) => {
        currentSpinValue.current = value;
      });
      
      // Arrow bounce animation during spin (up-down motion)
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowBounce, {
            toValue: 1,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowBounce, {
            toValue: -1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowBounce, {
            toValue: 0,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      bounceAnimation.start();
      
      // Update current pointer name periodically during spin
      const segmentAngle = 360 / options.length;
      const updateInterval = setInterval(() => {
        const currentAngle = (currentRotation + currentSpinValue.current) % 360;
        
        // Find the segment with the highest text position under the arrow
        let currentIndex = 0;
        let highestY = Infinity;
        
        for (let i = 0; i < options.length; i++) {
          const baseAngle = ((i + 0.5) * segmentAngle) * Math.PI / 180;
          const rotatedAngle = baseAngle - (currentAngle * Math.PI / 180);
          
          const textRadius = radius * 0.7;
          const x = center + Math.cos(rotatedAngle) * textRadius;
          const y = center + Math.sin(rotatedAngle) * textRadius;
          
          const isUnderArrow = y < center && Math.abs(x - center) < radius * 0.4;
          
          if (isUnderArrow && y < highestY) {
            highestY = y;
            currentIndex = i;
          }
        }
        
        setCurrentPointerName(options[currentIndex] || "");
      }, 50);
      
      Animated.timing(spinValue, {
        toValue: totalRotation,
        duration: 10000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        clearInterval(updateInterval);
        bounceAnimation.stop();
        arrowBounce.setValue(0);
        spinValue.removeListener(listenerId);
        
        const finalAngle = (currentRotation + totalRotation) % 360;
        setCurrentRotation(finalAngle);
        
        // Find the segment with the highest text position (smallest Y coordinate) under the arrow
        // Arrow is at the top, we want segments in the upper half (y < center)
        let winnerIndex = 0;
        let highestY = Infinity;
        
        segments.forEach((segment, index) => {
          // Calculate the current angle of this segment's text after rotation
          const baseAngle = ((index + 0.5) * segmentAngle) * Math.PI / 180;
          const rotatedAngle = baseAngle - (finalAngle * Math.PI / 180);
          
          // Convert to x, y coordinates
          const textRadius = radius * 0.7;
          const x = center + Math.cos(rotatedAngle) * textRadius;
          const y = center + Math.sin(rotatedAngle) * textRadius;
          
          // Check if segment is in the upper half (y < center means above horizontal center line)
          // And within a reasonable range under the arrow (x close to center)
          const isUnderArrow = y < center && Math.abs(x - center) < radius * 0.4;
          
          if (isUnderArrow && y < highestY) {
            highestY = y;
            winnerIndex = index;
          }
        });
        
        const winnerName = options[winnerIndex];
        setCurrentPointerName(winnerName);
        
        // Start celebration animation
        startCelebration();
        
        onSpinEnd(winnerName);
      });
      
      return () => {
        clearInterval(updateInterval);
        bounceAnimation.stop();
        spinValue.removeListener(listenerId);
      };
    } else {
      // Set initial pointer name when not spinning
      if (options.length > 0 && !currentPointerName) {
        const segmentAngle = 360 / options.length;
        
        // Find the segment with the highest text position under the arrow
        let currentIndex = 0;
        let highestY = Infinity;
        
        for (let i = 0; i < options.length; i++) {
          const baseAngle = ((i + 0.5) * segmentAngle) * Math.PI / 180;
          const rotatedAngle = baseAngle - (currentRotation * Math.PI / 180);
          
          const textRadius = radius * 0.7;
          const x = center + Math.cos(rotatedAngle) * textRadius;
          const y = center + Math.sin(rotatedAngle) * textRadius;
          
          const isUnderArrow = y < center && Math.abs(x - center) < radius * 0.4;
          
          if (isUnderArrow && y < highestY) {
            highestY = y;
            currentIndex = i;
          }
        }
        
        setCurrentPointerName(options[currentIndex] || "");
      }
    }
  }, [isSpinning, options]);

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

  const arrowStyle = {
    transform: [
      {
        translateY: arrowBounce.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-10, 0, 10], // Bounce up-down
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
      {/* Confetti Celebration */}
      {showCelebration && confettiParticles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.size / 2,
            transform: [
              {
                translateY: particle.animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, size + 100],
                }),
              },
              {
                rotate: particle.animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${particle.rotation * 3}deg`],
                }),
              },
              {
                scale: particle.animValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 0.5],
                }),
              },
            ],
            opacity: particle.animValue.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 1, 1, 0],
            }),
            zIndex: 5,
          }}
        />
      ))}

      {/* Arrow Pointer */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: -40,
          zIndex: 10,
        },
        arrowStyle
      ]}>
        <Svg width="60" height="60" viewBox="0 0 60 60">
          {/* Glow Circle */}
          <Circle
            cx="30"
            cy="32"
            r="22"
            fill="rgba(255, 107, 53, 0.2)"
          />
          <Circle
            cx="30"
            cy="32"
            r="18"
            fill="rgba(255, 107, 53, 0.3)"
          />
          {/* Arrow Shadow */}
          <Path
            d="M30 50 L20 30 L30 35 L40 30 Z"
            fill="rgba(0,0,0,0.3)"
          />
          {/* Arrow Body */}
          <Path
            d="M30 48 L18 28 L30 33 L42 28 Z"
            fill="#FF6B35"
            stroke="#FFF"
            strokeWidth="3"
          />
          {/* Arrow Highlight */}
          <Path
            d="M30 33 L24 30 L30 40 Z"
            fill="#FF8C5A"
          />
          {/* Arrow Tip Highlight */}
          <Circle
            cx="30"
            cy="48"
            r="3"
            fill="#FF4500"
          />
        </Svg>
      </Animated.View>

      {/* Current Name Display */}
      {currentPointerName && (
        <Box style={{
          position: 'absolute',
          top: -80,
          zIndex: 9,
          backgroundColor: 'rgba(255, 107, 53, 0.95)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: '#FFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <Text style={{
            color: '#FFF',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {currentPointerName}
          </Text>
        </Box>
      )}

      <Box style={{ position: 'relative', width: size, height: size }}>
        <Animated.View style={animatedStyle}>
          <Svg width={size} height={size}>
            {segments.map((segment, index) => {
              return (
                <G key={`segment-${index}-${segment.option}`}>
                  <Path
                    d={segment.path}
                    fill={colors[index]}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={segment.textPos.x}
                    y={segment.textPos.y}
                    fill="#000"
                    fontSize="12"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${segment.textPos.rotation > 180 ? segment.textPos.rotation + 180 : segment.textPos.rotation}, ${segment.textPos.x}, ${segment.textPos.y})`}
                  >
                    {segment.option.length > 10 ? segment.option.substring(0, 8) + '...' : segment.option}
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

  // Fetch users from API
  async function fetchUsers() {
    try {
      setLoading(true);
      // Fetch only residents using the role-specific endpoint
      // Exclude profile pictures for better performance (binary data is slow)
      const usersResponse = await api.get("users/role?role=resident&includeProfilePicture=false");
      const residents = usersResponse.data.data.users ?? [];
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

  // Create a user lookup map for O(1) access
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((user) => {
      map.set(String(user.id), user);
    });
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (user.userName || "")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [searchText, users]);

  const wheelParticipants = useMemo<WheelParticipant[]>(() => {
    // Use Map for O(1) lookup instead of O(n) find()
    return Array.from(selectedUsers).map((userId) => {
      const user = userMap.get(userId);
      return {
        id: String(user?.id ?? ""),
        name: user?.userName || "Unknown",
        ...(user?.profilePicture ? { profilePicture: user.profilePicture } : {}),
      };
    });
  }, [selectedUsers, userMap]);

  const wheelOptions = wheelParticipants.map((p) => p.name);
  const wheelColors = generateWheelColors(wheelParticipants.length);

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    newSelected.has(userId)
      ? newSelected.delete(userId)
      : newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => String(u.id))));
    }
  };

  const handleSpin = () => {
    if (wheelParticipants.length < 1) {
      Alert.alert("Error", "Please select at least 1 participant");
      return;
    }
    setSpinning(true);
  };

  const handleSpinEnd = (winnerName: string) => {
    setSpinning(false);
    Alert.alert("🎉 Congratulations!", "");
  };

  // Memoized user item to prevent unnecessary re-renders
  const UserItem = React.memo(({ user }: { user: User }) => {
    const userId = String(user.id);
    const userName = user.userName || "Unknown";
    const isSelected = selectedUsers.has(userId);
    
    return (
      <Pressable
        key={userId}
        onPress={() => handleUserToggle(userId)}
        style={[
          styles.userItem,
          isSelected && styles.selectedUserItem,
        ]}
      >
        <HStack space="md" alignItems="center" flex={1}>
          <Checkbox
            value={userId}
            isChecked={isSelected}
            onChange={() => handleUserToggle(userId)}
            aria-label={`Select ${userName}`}
          >
            <CheckboxIndicator mr="$2">
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
          </Checkbox>
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
  }, (prevProps, nextProps) => {
    // Custom comparison: only re-render if user data changed or selection state changed
    const prevUserId = String(prevProps.user.id);
    const nextUserId = String(nextProps.user.id);
    return prevUserId === nextUserId && 
           prevProps.user.userName === nextProps.user.userName &&
           prevProps.user.resident?.currentPoints === nextProps.user.resident?.currentPoints;
  });

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
                filteredUsers.map((user) => <UserItem key={user.id} user={user} />)
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
    position: "relative",
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