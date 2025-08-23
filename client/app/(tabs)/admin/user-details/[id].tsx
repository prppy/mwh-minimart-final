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
  userRole: string;
  profilePicture: string;
  resident: {
    totalPoints: number;
    currentPoints: number;
    batchNumber: string;
    dateOfAdmission: string;
  } | null;
  officer: {
    officerEmail: string;
  } | null;
};

const UserDetails: React.FC = () => {
  const { id, role } = useLocalSearchParams<{ id: string; role: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const u = res.data?.data;
        if (!u) return;

        const transformedUser = {
          id: u.id.toString(),
          name: u.userName,
          userRole: u.userRole,
          profilePicture: u.profilePicture || "https://placekitten.com/200/200",
          resident:
            u.userRole === "resident" && u.resident
              ? {
                  totalPoints: u.resident.totalPoints || 0,
                  currentPoints: u.resident.currentPoints || 0,
                  batchNumber: u.resident.batchNumber?.toString() || "-",
                  dateOfAdmission: u.resident.dateOfAdmission || "",
                  lastAbscondence: u.resident.lastAbsondence || "",
                }
              : null,
          officer:
            u.userRole === "officer" && u.officer
              ? {
                  officerEmail: u.officer.officerEmail || "-",
                }
              : null,
        };

        setUser(transformedUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      setLoading(true);
      fetchUser();
    }
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

  // inside your component, after `if (!user) return ...`
  let rowItems: { label: string; value: string | number }[][] = [];

  if (user.userRole === "resident" && user.resident) {
    rowItems = [
      [
        { label: "Leaderboard", value: user.resident.totalPoints ?? 0 },
        { label: "Points", value: user.resident.currentPoints ?? 0 },
      ],
      [
        { label: "Batch Number", value: user.resident.batchNumber ?? "-" },
        {
          label: "Admission",
          value: new Date(user.resident.dateOfAdmission).toLocaleDateString(),
        },
      ],
    ];
  } else if (user.userRole === "officer" && user.officer) {
    rowItems = [
      [
        { label: "Email", value: user.officer.officerEmail ?? "-" },
        { label: "User ID", value: user.id },
      ],
    ];
  }

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
