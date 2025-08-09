import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { VStack, Box, ScrollView } from "@gluestack-ui/themed";
import { DataTable } from "react-native-paper";
import { ADMIN_PURPLE, LIGHTEST_PURPLE } from "../../../constants/colors";
import RoleOptions from "@/components/admin pages/RoleOptions";
import RowsPerPageSelector from "@/components/admin pages/RowsPerPageSelector";
import SearchBar from "@/components/Searchbar";
import { renderHighlightedText } from "@/utils/searchUtils";
import ProfileAvatar from "@/components/ProfileAvatar";
import api from "@/components/utility/api";
import { User } from "@/constants/types";

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

  const [officers, setOfficers] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
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

  const renderRow = (item: any, index: number) => (
    <DataTable.Row
      key={item.id}
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
          <DataTable.Cell>{item.resident?.currentPoints ?? "-"}</DataTable.Cell>
          <DataTable.Cell>{item.resident?.batchNumber || "-"}</DataTable.Cell>
          <DataTable.Cell>Actions</DataTable.Cell>
        </>
      )}
    </DataTable.Row>
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
        onChangeText={setSearchText}
        placeholder="Search by name"
      />

      <Box borderRadius={12} overflow="hidden" mt={20}>
        <DataTable>
          <DataTable.Header style={{ backgroundColor: LIGHTEST_PURPLE }}>
            {columns.map((col, index) => (
              <DataTable.Title
                textStyle={{ color: "black", fontWeight: "bold" }}
                key={index}
              >
                {col}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          {loading ? (
            <DataTable.Row>
              <DataTable.Cell>Loading...</DataTable.Cell>
            </DataTable.Row>
          ) : (
            filteredData
              .slice(from, to)
              .map((item, index) => renderRow(item, index))
          )}

          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$2"
            bg={LIGHTEST_PURPLE}
          >
            <Box flexDirection="row" alignItems="center">
              <Text style={styles.rowsPerPageText}>Rows per page:</Text>
              <RowsPerPageSelector
                value={itemsPerPage}
                options={rowsPerPageOptions}
                onChange={(newValue) => {
                  setItemsPerPage(newValue);
                  setPage(0);
                }}
              />
            </Box>

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(filteredData.length / itemsPerPage)}
              onPageChange={(newPage: number) => setPage(newPage)}
              label={`${from + 1}-${to} of ${filteredData.length}`}
              showFastPaginationControls
              numberOfItemsPerPage={itemsPerPage}
            />
          </Box>
        </DataTable>
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
