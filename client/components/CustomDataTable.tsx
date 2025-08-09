import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Box } from "@gluestack-ui/themed";
import { DataTable } from "react-native-paper";
import RowsPerPageSelector from "./RowsPerPageSelector";

interface CustomDataTableProps<T> {
  columns: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  page: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPageText?: string;
  totalCount: number;
}

function CustomDataTable<T>({
  columns,
  data,
  renderRow,
  loading = false,
  page,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  rowsPerPageOptions = [5, 10, 15],
  rowsPerPageText = "Rows per page:",
  totalCount,
}: CustomDataTableProps<T>) {
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <Box borderRadius={12} overflow="hidden" mt={20}>
      <DataTable>
        <DataTable.Header
          style={{ backgroundColor: "#E6E6FA" /* LIGHTEST_PURPLE */ }}
        >
          {columns.map((col, idx) => (
            <DataTable.Title
              textStyle={{ color: "black", fontWeight: "bold" }}
              key={idx}
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
          data.map((item, idx) => renderRow(item, idx))
        )}

        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          px="$4"
          py="$2"
          bg="#E6E6FA"
        >
          <Box flexDirection="row" alignItems="center">
            <Text style={styles.rowsPerPageText}>{rowsPerPageText}</Text>
            <RowsPerPageSelector
              value={itemsPerPage}
              options={rowsPerPageOptions}
              onChange={(newValue) => {
                onItemsPerPageChange(newValue);
                onPageChange(0); // reset page on rows per page change
              }}
            />
          </Box>

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={onPageChange}
            label={`${from + 1}-${to} of ${totalCount}`}
            showFastPaginationControls
            numberOfItemsPerPage={itemsPerPage}
          />
        </Box>
      </DataTable>
    </Box>
  );
}

const styles = StyleSheet.create({
  rowsPerPageText: { color: "black", marginRight: 8, fontSize: 12 },
});

export default CustomDataTable;
