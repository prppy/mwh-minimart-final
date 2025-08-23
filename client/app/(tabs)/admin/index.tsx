import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { VStack, Box, ScrollView, Pressable } from "@gluestack-ui/themed";
import { DataTable } from "react-native-paper";
import { ADMIN_PURPLE, LIGHTEST_PURPLE } from "../../../constants/colors";
import RoleOptions from "@/components/admin pages/RoleOptions";
import RowsPerPageSelector from "@/components/RowsPerPageSelector";
import SearchBar from "@/components/Searchbar";
import { renderHighlightedText } from "@/utils/searchUtils";
import ProfileAvatar from "@/components/ProfileAvatar";
import api from "@/components/utility/api";
import { User } from "@/constants/types";
import CustomDataTable from "@/components/CustomDataTable";

const officerColumns = [
  "Officer ID",
  "Full Name",
  "Email",
  // "Joined Date",
  "Actions",
];

const residentColumns = [
  "Resident ID",
  "Full Name",
  "Date of Birth",
  "Date of Admission",
  "Last Abscondence",
  "Current Points",
  "Batch Number",
  "Actions",
];

const AdminUsers: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<"residents" | "officers">(
    "residents"
  );
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [officers, setOfficers] = useState<User[]>([]);
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const rowsPerPageOptions = [5, 10, 15];

  const columns = useMemo(() => {
    return selectedRole === "officers" ? officerColumns : residentColumns;
  }, [selectedRole]);

  async function fetchUsers() {
    try {
      setLoading(true);

      const usersResponse = await api.get("users");
      const users = usersResponse.data.data.users ?? [];

      // separate by role
      const residents = users.filter(
        (user: User) => user.userRole === "resident"
      );
      const officers = users.filter(
        (user: User) => user.userRole === "officer"
      );

      setResidents(residents);
      setOfficers(officers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const rawData = selectedRole === "officers" ? officers : residents;

  const filteredData = useMemo(() => {
    return rawData.filter((item) =>
      item.userName?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, rawData]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);

  const router = useRouter(); // to navigate

  const renderRow = (item: any, index: number) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: `/admin/user-details/${item.id}`,
          params: { role: selectedRole },
        })
      }
      key={item.id}
    >
      <DataTable.Row
        style={{
          backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
        }}
      >
        {selectedRole === "officers" ? (
          <>
            <DataTable.Cell>{item.id}</DataTable.Cell>
            <DataTable.Cell>
              <Box style={{ flexDirection: "row", alignItems: "center" }}>
                <ProfileAvatar
                  source={item.profilePicture}
                  borderColor={item.color}
                  scale={0.9}
                />
                <Text>{renderHighlightedText(item.userName, searchText)}</Text>
              </Box>
            </DataTable.Cell>
            <DataTable.Cell>{item.officer?.officerEmail || "-"}</DataTable.Cell>
            <DataTable.Cell>Actions</DataTable.Cell>
          </>
        ) : (
          <>
            <DataTable.Cell>{item.id}</DataTable.Cell>
            <DataTable.Cell>
              <Box style={{ flexDirection: "row", alignItems: "center" }}>
                <ProfileAvatar
                  source={item.profilePicture}
                  borderColor={item.color}
                  scale={0.9}
                />
                <Text>{renderHighlightedText(item.userName, searchText)}</Text>
              </Box>
            </DataTable.Cell>
            <DataTable.Cell>
              {item.resident?.dateOfBirth
                ? new Date(item.resident.dateOfBirth).toLocaleDateString()
                : "-"}
            </DataTable.Cell>
            <DataTable.Cell>
              {item.resident?.dateOfAdmission
                ? new Date(item.resident.dateOfAdmission).toLocaleDateString()
                : "-"}
            </DataTable.Cell>
            <DataTable.Cell>
              {item.resident?.lastAbscondence
                ? new Date(item.resident.lastAbscondence).toLocaleDateString()
                : "-"}
            </DataTable.Cell>
            <DataTable.Cell>
              {item.resident?.currentPoints ?? "-"}
            </DataTable.Cell>
            <DataTable.Cell>{item.resident?.batchNumber || "-"}</DataTable.Cell>
            <DataTable.Cell>Actions</DataTable.Cell>
          </>
        )}
      </DataTable.Row>
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Box style={styles.roleOptionsContainer}>
        <RoleOptions selectedRole={selectedRole} onChange={setSelectedRole} />
      </Box>

      <SearchBar
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          setPage(0);
        }}
        placeholder="Search by name"
      />

      <Box borderRadius={12} overflow="hidden" mt={20}>
        <CustomDataTable
          columns={columns}
          data={filteredData.slice(from, to)}
          loading={loading}
          page={page}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          totalCount={filteredData.length}
          renderRow={renderRow}
        />
      </Box>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_PURPLE,
    padding: 30,
  },
  roleOptionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  searchInput: {
    marginTop: 20,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  rowsPerPageText: { color: "black", marginRight: 8, fontSize: 12 },
});

export default AdminUsers;
