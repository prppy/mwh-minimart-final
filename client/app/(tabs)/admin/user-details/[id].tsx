import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  Box,
  HStack,
  VStack,
  Text,
  Image as GSImage,
  ScrollView,
} from "@gluestack-ui/themed";
import { useLocalSearchParams } from "expo-router";
import api from "@/components/utility/api";
import { ADMIN_PURPLE } from "@/constants/colors";

type User = {
  id: string;
  name: string;
  leaderboard: number;
  points: number;
  profilePicture: string;
  batchNumber: string;
  dateOfAdmission: string;
};

const UserDetails: React.FC = () => {
  const { id, role } = useLocalSearchParams<{ id: string; role: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        // Transform API response to match your User type
        if (role === "residents" && res.data?.data) {
          const u = res.data.data; // your API shape
          setUser({
            id: u.id.toString(),
            name: u.userName,
            leaderboard: u.resident?.totalPoints || 0,
            points: u.resident?.currentPoints || 0,
            profilePicture:
              u.profilePicture || "https://placekitten.com/200/200",
            batchNumber: u.resident?.batchNumber?.toString() || "-",
            dateOfAdmission: u.resident?.dateOfAdmission || "",
          });
        }
        // For officers you can add another branch here
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, role]);

  if (loading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text>User not found</Text>
      </Box>
    );
  }

  const rowItems = [
    [
      { label: "Leaderboard", value: user.leaderboard },
      { label: "Points", value: `${user.points} pts` },
    ],
    [
      { label: "Batch Number", value: user.batchNumber },
      {
        label: "Admission",
        value: new Date(user.dateOfAdmission).toLocaleDateString(),
      },
    ],
  ];

  return (
    <ScrollView flex={1} bg={ADMIN_PURPLE}>
      <Box flex={1} p={28}>
        <HStack space="2xl" alignItems="center" p="$4">
          {/* Profile Picture */}
          <Box
            borderRadius="$full"
            overflow="hidden"
            borderWidth={4}
            borderColor="black"
            backgroundColor="white"
          >
            <GSImage
              source={{ uri: user.profilePicture }}
              alt="Profile Picture"
              width={200}
              height={200}
            />
          </Box>

          {/* Profile Info */}
          <VStack flex={1} space="lg" marginLeft={40}>
            <Text style={styles.name}>{user.name}</Text>

            {/* row items */}
            {rowItems.map((row, i) => (
              <HStack key={i} space="lg">
                {row.map((item, idx) => (
                  <Box key={idx} style={[styles.selectorCard, { flex: 1 }]}>
                    <Text style={styles.detailsLabel}>{item.label}</Text>
                    <Text style={styles.detailsValue}>{item.value}</Text>
                  </Box>
                ))}
              </HStack>
            ))}
            {/* Recent Transactions */}
            <Box style={styles.selectorCard}>
              <Text style={styles.detailsLabel}>Recent Transactions</Text>
              {/* TODO: fetch user.transactions and map here */}
            </Box>
          </VStack>
        </HStack>
      </Box>
    </ScrollView>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  name: {
    fontWeight: "bold",
    fontSize: 36,
    marginBottom: 12,
    color: "black",
  },
  detailsLabel: {
    fontWeight: "500",
    fontSize: 22,
    marginBottom: 6,
    color: "black",
  },
  selectorCard: {
    borderRadius: 15,
    backgroundColor: "white",
    padding: 20,
  },
  detailsValue: {
    fontWeight: "400",
    fontSize: 20,
    marginTop: 4,
    color: "black",
  },
});
