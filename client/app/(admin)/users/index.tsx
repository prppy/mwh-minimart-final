import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { DataTable } from "react-native-paper";
import { Plus, X, Pencil } from "lucide-react-native";

import SearchBar from "@/components/custom-searchbar";
import RowsPerPageSelector from "@/components/RowsPerPageSelector";
import { Resident, Officer } from "@/utils/types";
import api from "@/utils/api";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";

// Remarks options matching the backend enum
const REMARKS_OPTIONS = [
  { label: "Discharged", value: "discharged" },
  { label: "FTR", value: "ftr" },
  { label: "Abscondence", value: "abscondence" },
  { label: "Extended Homeleave", value: "extended_homeleave" },
];

// Status options
const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

type ResidentFormData = {
  userName: string;
  serialNumber: string;
  dateOfAdmission: string;
  isActive: boolean;
  remarks: string;
  password: string;
};

const EMPTY_FORM: ResidentFormData = {
  userName: "",
  serialNumber: "",
  dateOfAdmission: new Date().toISOString().split("T")[0],
  isActive: true,
  remarks: "",
  password: "",
};

const UserManagementPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<"residents" | "officers">(
    "residents"
  );
  const [users, setUsers] = useState<(Resident | Officer)[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const rowsPerPageOptions = [5, 10, 25, 50];

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResidentFormData>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ResidentFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch users whenever search / role / pagination changes
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const backendRole = selectedRole === "residents" ? "resident" : "officer";
      const res = await api.get(
        `/users?role=${backendRole}&limit=${itemsPerPage}&offset=${
          page * itemsPerPage
        }&search=${search}`
      );
      setUsers(res.data.data.users);
      setTotalCount(res.data.data.pagination.total);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, page, itemsPerPage, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ResidentFormData, string>> = {};

    if (!formData.userName.trim()) {
      errors.userName = "Full Name is required";
    }
    if (!formData.serialNumber.trim()) {
      errors.serialNumber = "Serial Number is required";
    }
    if (!formData.dateOfAdmission) {
      errors.dateOfAdmission = "Date of Admission is required";
    }
    if (!showEditModal && !formData.password.trim()) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add resident
  const handleAddResident = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await api.post("/authentication/register/resident", {
        userName: formData.userName.trim(),
        password: formData.password.trim(),
        serialNumber: formData.serialNumber.trim(),
        dateOfAdmission: new Date(formData.dateOfAdmission).toISOString(),
        isActive: formData.isActive,
        remarks: formData.remarks || null,
      });
      setShowAddModal(false);
      setFormData({ ...EMPTY_FORM });
      setFormErrors({});
      fetchUsers();
    } catch (err: any) {
      console.error("Add resident error:", err);
      alert("Failed to add resident: " + (err.message || "Please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit resident
  const handleEditResident = async () => {
    if (!validateForm()) return;
    if (!editingUserId) return;
    setSubmitting(true);
    try {
      await api.put(`/users/${editingUserId}`, {
        userName: formData.userName.trim(),
        resident: {
          serialNumber: formData.serialNumber.trim(),
          dateOfAdmission: new Date(formData.dateOfAdmission).toISOString(),
          isActive: formData.isActive,
          remarks: formData.remarks || null,
        },
      });
      setShowEditModal(false);
      setFormData({ ...EMPTY_FORM });
      setFormErrors({});
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      console.error("Edit resident error:", err);
      alert("Failed to update resident: " + (err.message || "Please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      userName: user.userName || "",
      serialNumber: user.resident?.serialNumber || "",
      dateOfAdmission: user.resident?.dateOfAdmission
        ? new Date(user.resident.dateOfAdmission).toISOString().split("T")[0]
        : "",
      isActive: user.resident?.isActive !== false,
      remarks: user.resident?.remarks || "",
      password: "",
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Format date for display
  const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-SG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Render the form fields (shared between add & edit modals)
  const renderResidentForm = (isEdit: boolean) => (
    <VStack space="md" className="w-full">
      {/* Full Name */}
      <FormControl isInvalid={!!formErrors.userName}>
        <FormControlLabel>
          <FormControlLabelText className="text-typography-700 font-semibold">
            Full Name *
          </FormControlLabelText>
        </FormControlLabel>
        <Input className="bg-background-50">
          <InputField
            placeholder="Enter full name"
            value={formData.userName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, userName: text }))
            }
          />
        </Input>
        {formErrors.userName && (
          <FormControlError>
            <FormControlErrorText>{formErrors.userName}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Serial Number */}
      <FormControl isInvalid={!!formErrors.serialNumber}>
        <FormControlLabel>
          <FormControlLabelText className="text-typography-700 font-semibold">
            Serial Number *
          </FormControlLabelText>
        </FormControlLabel>
        <Input className="bg-background-50">
          <InputField
            placeholder="Enter serial number"
            value={formData.serialNumber}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, serialNumber: text }))
            }
          />
        </Input>
        {formErrors.serialNumber && (
          <FormControlError>
            <FormControlErrorText>{formErrors.serialNumber}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Date of Admission — calendar input */}
      <FormControl isInvalid={!!formErrors.dateOfAdmission}>
        <FormControlLabel>
          <FormControlLabelText className="text-typography-700 font-semibold">
            Date of Admission *
          </FormControlLabelText>
        </FormControlLabel>
        {Platform.OS === "web" ? (
          <input
            type="date"
            value={formData.dateOfAdmission}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dateOfAdmission: e.target.value,
              }))
            }
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
              backgroundColor: "#f9fafb",
              width: "100%",
              outline: "none",
            }}
          />
        ) : (
          <Input className="bg-background-50">
            <InputField
              placeholder="YYYY-MM-DD"
              value={formData.dateOfAdmission}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, dateOfAdmission: text }))
              }
            />
          </Input>
        )}
        {formErrors.dateOfAdmission && (
          <FormControlError>
            <FormControlErrorText>{formErrors.dateOfAdmission}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Status Dropdown */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText className="text-typography-700 font-semibold">
            Status
          </FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={formData.isActive ? "true" : "false"}
          onValueChange={(val) =>
            setFormData((prev) => ({ ...prev, isActive: val === "true" }))
          }
        >
          <SelectTrigger className="bg-background-50">
            <SelectInput placeholder="Select status" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      {/* Remarks Dropdown */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText className="text-typography-700 font-semibold">
            Remarks
          </FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={formData.remarks}
          onValueChange={(val) =>
            setFormData((prev) => ({ ...prev, remarks: val }))
          }
        >
          <SelectTrigger className="bg-background-50">
            <SelectInput placeholder="Select remarks (optional)" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              <SelectItem label="None" value="" />
              {REMARKS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      {/* Password (only for new residents) */}
      {!isEdit && (
        <FormControl isInvalid={!!formErrors.password}>
          <FormControlLabel>
            <FormControlLabelText className="text-typography-700 font-semibold">
              Password *
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="bg-background-50">
            <InputField
              placeholder="Enter password"
              value={formData.password}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, password: text }))
              }
              secureTextEntry
            />
          </Input>
          {formErrors.password && (
            <FormControlError>
              <FormControlErrorText>{formErrors.password}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>
      )}
    </VStack>
  );

  // Get remarks display label
  const getRemarksLabel = (val: string | null | undefined): string => {
    if (!val) return "—";
    const opt = REMARKS_OPTIONS.find((o) => o.value === val);
    return opt ? opt.label : val;
  };

  // Column labels for residents
  const residentColumns = [
    "Name",
    "Serial No.",
    "Date of Admission",
    "Status",
    "Remarks",
    "Points",
    "Actions",
  ];

  // Column labels for officers
  const officerColumns = ["Name", "Role", "Email", "Actions"];

  // Row renderer for residents
  const renderResidentRow = (user: any, index: number) => (
    <DataTable.Row key={index} style={{ backgroundColor: "#fff" }}>
      <DataTable.Cell>{user.userName}</DataTable.Cell>
      <DataTable.Cell>{user.resident?.serialNumber || "—"}</DataTable.Cell>
      <DataTable.Cell>
        {formatDate(user.resident?.dateOfAdmission)}
      </DataTable.Cell>
      <DataTable.Cell>
        <View
          style={{
            backgroundColor: user.resident?.isActive !== false ? "#dcfce7" : "#fee2e2",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: user.resident?.isActive !== false ? "#166534" : "#991b1b",
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {user.resident?.isActive !== false ? "Active" : "Inactive"}
          </Text>
        </View>
      </DataTable.Cell>
      <DataTable.Cell>
        {getRemarksLabel(user.resident?.remarks)}
      </DataTable.Cell>
      <DataTable.Cell>
        {`${user.resident?.currentPoints ?? 0} pts`}
      </DataTable.Cell>
      <DataTable.Cell>
        <Pressable onPress={() => openEditModal(user)}>
          <Icon as={Pencil} size="sm" className="text-indigoscale-700" />
        </Pressable>
      </DataTable.Cell>
    </DataTable.Row>
  );

  // Row renderer for officers
  const renderOfficerRow = (user: any, index: number) => (
    <DataTable.Row key={index} style={{ backgroundColor: "#fff" }}>
      <DataTable.Cell>{user.userName}</DataTable.Cell>
      <DataTable.Cell>{user.userRole}</DataTable.Cell>
      <DataTable.Cell>{user.officer?.officerEmail || "—"}</DataTable.Cell>
      <DataTable.Cell>
        <Text>Edit</Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  const columns =
    selectedRole === "residents" ? residentColumns : officerColumns;
  const renderRow =
    selectedRole === "residents" ? renderResidentRow : renderOfficerRow;

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, totalCount);

  return (
    <VStack className="flex-1 p-5 bg-indigoscale-500">
      {/* TOP BAR */}
      <HStack className="w-full justify-between gap-5 items-center">
        <SearchBar search={search} setSearch={setSearch} />

        <HStack space="md" className="items-center">
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

          {/* Add Resident button — only shown on Residents tab */}
          {selectedRole === "residents" && (
            <Button
              action="primary"
              className="bg-indigoscale-700"
              onPress={() => {
                setFormData({ ...EMPTY_FORM });
                setFormErrors({});
                setShowAddModal(true);
              }}
            >
              <ButtonIcon as={Plus} className="text-white" />
              <ButtonText className="text-white">Add Resident</ButtonText>
            </Button>
          )}
        </HStack>
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
            <ScrollView>
              {users.map((u, idx) => renderRow(u, idx))}
            </ScrollView>
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

      {/* ADD RESIDENT MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg" className="text-indigoscale-700">
              Add New Resident
            </Heading>
            <ModalCloseButton>
              <Icon as={X} size="md" className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>{renderResidentForm(false)}</ModalBody>
          <ModalFooter>
            <Button
              action="secondary"
              variant="outline"
              onPress={() => setShowAddModal(false)}
              className="mr-3"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="primary"
              className="bg-indigoscale-700"
              onPress={handleAddResident}
              isDisabled={submitting}
            >
              <ButtonText className="text-white">
                {submitting ? "Adding..." : "Add Resident"}
              </ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* EDIT RESIDENT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg" className="text-indigoscale-700">
              Edit Resident
            </Heading>
            <ModalCloseButton>
              <Icon as={X} size="md" className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>{renderResidentForm(true)}</ModalBody>
          <ModalFooter>
            <Button
              action="secondary"
              variant="outline"
              onPress={() => setShowEditModal(false)}
              className="mr-3"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="primary"
              className="bg-indigoscale-700"
              onPress={handleEditResident}
              isDisabled={submitting}
            >
              <ButtonText className="text-white">
                {submitting ? "Saving..." : "Save Changes"}
              </ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UserManagementPage;
