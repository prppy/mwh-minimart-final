import React, { useState, useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { VStack, Box, ScrollView } from "@gluestack-ui/themed";
import { DataTable } from "react-native-paper";
import { ADMIN_PURPLE, LIGHTEST_PURPLE } from "../../../constants/colors";
import RoleOptions from "@/components/admin pages/RoleOptions";
import RowsPerPageSelector from "@/components/admin pages/RowsPerPageSelector";
import SearchBar from "@/components/Searchbar";
import { renderHighlightedText } from "@/utils/searchUtils";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  Icon,
  ChevronDownIcon,
  SelectPortal,
  SelectContent,
  SelectItem,
} from "@gluestack-ui/themed";

// dummy data for now
const rawData = Array(23)
  .fill(0)
  .map((_, idx) => ({
    id: idx + 1,
    name: `User ${idx + 1}`,
    email: `user${idx + 1}@example.com`,
    role: "Admin",
  }));

const officerColumns = [
  "Officer ID",
  "Full Name",
  "Email",
  // "Joined Date",
  "Actions",
];

const userColumns = [
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
  // some setups
  const [selectedRole, setSelectedRole] = useState<
    "residents" | "officers" | null
  >("residents");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const rowsPerPageOptions = [5, 10, 15];

  // to change columns
  const columns = useMemo(() => {
    if (selectedRole === "officers") {
      return officerColumns;
    } else {
      return userColumns;
    }
  }, [selectedRole]);

  // filter data by search text
  const filteredData = useMemo(() => {
    return rawData.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, rawData]);

  // pagination
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);

  // function to render the right table (fake data for now..)
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
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                justifyContent: "flex-start",
              }}
            >
              <ProfileAvatar
                source={item.profilePic}
                borderColor={item.color}
                scale={0.9} // or 1.2 if you want it bigger
              />
              <Text>{renderHighlightedText(item.name, searchText)}</Text>
            </Box>
          </DataTable.Cell>
          <DataTable.Cell>{item.email}</DataTable.Cell>
          <DataTable.Cell>Actions</DataTable.Cell>
        </>
      ) : (
        <>
          <DataTable.Cell>{item.id}</DataTable.Cell>
          <DataTable.Cell>
            {" "}
            {renderHighlightedText(item.name, searchText)}
          </DataTable.Cell>
          <DataTable.Cell>12/12/1990</DataTable.Cell>
          <DataTable.Cell>01/01/2020</DataTable.Cell>
          <DataTable.Cell>-</DataTable.Cell>
          <DataTable.Cell>100</DataTable.Cell>
          <DataTable.Cell>Batch 3</DataTable.Cell>
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
      {/* ROLE OPTIONS */}
      <Box style={styles.roleOptionsContainer}>
        <RoleOptions selectedRole={selectedRole} onChange={setSelectedRole} />
      </Box>

      {/* SEARCHBAR */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by name"
      />

      {/* TABLE */}
      <Box borderRadius={12} overflow="hidden" mt={20}>
        <DataTable>
          {/* header */}
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

          {/* rows! */}
          {filteredData
            .slice(from, to)
            .map((item, index) => renderRow(item, index))}
          {/* pagination + rows per page selector container */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$2"
            bg={LIGHTEST_PURPLE}
          >
            {/* rows per page selector */}
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

            {/* pagination */}
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
