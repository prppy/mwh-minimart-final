import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { DataTable } from "react-native-paper";

import SearchBar from "@/components/custom-searchbar";
import RowsPerPageSelector from "@/components/RowsPerPageSelector";
import { Resident, Officer } from "@/utils/types";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";

const UserManagementPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<"residents" | "officers">(
    "residents"
  );
  const [users, setUsers] = useState<(Resident | Officer)[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0); // server-side pages start at 0
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const rowsPerPageOptions = [5, 10, 25, 50];

  // Fetch users whenever search / role / pagination changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      const backendRole = selectedRole === "residents" ? "resident" : "officer";

      const res = await fetch(
        `http://localhost:3000/api/users?role=${backendRole}&limit=${itemsPerPage}&offset=${
          page * itemsPerPage
        }&search=${search}`
      );

      const json = await res.json();

      setUsers(json.data.users);
      setTotalCount(json.data.pagination.total);
      setLoading(false);
    };

    fetchUsers();
  }, [selectedRole, page, itemsPerPage, search]);

  // Column labels
  const columns = ["Name", "Role", "Email / Points", "Actions"];

  // Row renderer based on role
  const renderRow = (user: any, index: number) => (
    <DataTable.Row key={index} style={{ backgroundColor: "#fff" }}>
      <DataTable.Cell>{user.userName}</DataTable.Cell>
      <DataTable.Cell>{user.userRole}</DataTable.Cell>

      <DataTable.Cell>
        {user.userRole === "resident"
          ? `${user.resident?.currentPoints ?? 0} points`
          : user.officer?.officerEmail}
      </DataTable.Cell>

      <DataTable.Cell>
        <Text>Edit</Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <VStack className="flex-1 p-5 bg-indigoscale-500">
      {/* TOP BAR */}
      <HStack className="w-full justify-between gap-5">
        <SearchBar search={search} setSearch={setSearch} />

        <Button
          action="secondary"
          className={selectedRole === "residents" ? "bg-indigoscale-700" : ""}
          onPress={() => {
            setSelectedRole("residents");
            setPage(0);
          }}
        >
          <ButtonText
            className={
              selectedRole === "residents"
                ? "text-white"
                : "text-indigoscale-700"
            }
          >
            Residents
          </ButtonText>
        </Button>

        <Button
          action="secondary"
          className={selectedRole === "officers" ? "bg-indigoscale-700" : ""}
          onPress={() => {
            setSelectedRole("officers");
            setPage(0);
          }}
        >
          <ButtonText
            className={
              selectedRole === "officers"
                ? "text-white"
                : "text-indigoscale-700"
            }
          >
            Officers
          </ButtonText>
        </Button>
      </HStack>

      {/* TABLE */}
      <View style={{ borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
        <DataTable>
          {/* TABLE HEADER */}
          <DataTable.Header style={{ backgroundColor: "#E6E6FA" }}>
            {columns.map((col, idx) => (
              <DataTable.Title
                key={idx}
                textStyle={{ color: "black", fontWeight: "bold" }}
              >
                {col}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          {/* ROWS */}
          {loading ? (
            <DataTable.Row>
              <DataTable.Cell>Loading...</DataTable.Cell>
            </DataTable.Row>
          ) : (
            <ScrollView>{users.map((u, idx) => renderRow(u, idx))}</ScrollView>
          )}

          {/* FOOTER */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#E6E6FA",
            }}
          >
            {/* ROWS PER PAGE SELECTOR */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ marginRight: 8, color: "black", fontSize: 12 }}>
                Rows per page:
              </Text>

              <RowsPerPageSelector
                value={itemsPerPage}
                options={rowsPerPageOptions}
                onChange={(n) => {
                  setItemsPerPage(n);
                  setPage(0);
                }}
              />
            </View>

            {/* PAGINATION */}
            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(totalCount / itemsPerPage)}
              onPageChange={(p) => setPage(p)}
              label={`${from + 1}-${to} of ${totalCount}`}
              showFastPaginationControls
              numberOfItemsPerPage={itemsPerPage}
            />
          </View>
        </DataTable>
      </View>
    </VStack>
  );
};

export default UserManagementPage;
