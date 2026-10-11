import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Award, Check, Download, Pencil, Plus, Search, Trash, X } from "lucide-react-native";

import api from "@/utils/api";
import { getVoucherIcon, VOUCHER_ICON_OPTIONS } from "@/constants/voucher-icons";

import DropdownSelect from "@/components/dropdown-select";
import { Button, ButtonIcon, ButtonText } from "@/components/button";
import * as alert from "@/components/ui/alert-dialog";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";

const MOBILE_BREAKPOINT = 768;
const BLUE = "#1f3a93";

type Category = {
  id: number;
  taskCategoryName: string;
  taskCategoryDescription: string;
  iconName?: string | null;
  _count?: { tasks: number };
};
type Subtask = {
  id: number;
  taskName: string;
  taskDescription: string;
  points: number;
  taskCategoryId: number;
};
type Resident = {
  id: number;
  userName: string;
  resident?: { serialNumber?: string; isActive?: boolean; remarks?: string; currentPoints?: number };
};
type Confirm = { title: string; message: string; confirmLabel: string; onConfirm: () => Promise<void> };
type CategoryForm = { taskCategoryName: string; taskCategoryDescription: string; iconName: string | null };
type SubtaskForm = { taskName: string; taskDescription: string; points: number };

/*
 * Form modals. The Gluestack Modal drops keystrokes on web if it re-renders
 * while you type, so the Modal shell below never re-renders: all field state
 * lives in the *Fields components rendered inside it.
 */
const FormModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <Modal isOpen onClose={onClose} size="lg">
    <ModalBackdrop />
    <ModalContent>
      <ModalHeader>
        <Heading size="lg" className="text-indigoscale-700">{title}</Heading>
        <ModalCloseButton><Icon as={X} size="md" /></ModalCloseButton>
      </ModalHeader>
      {children}
    </ModalContent>
  </Modal>
);

const CategoryFormFields: React.FC<{
  initial: Category | null;
  onClose: () => void;
  onSave: (data: CategoryForm) => Promise<boolean>;
}> = ({ initial, onClose, onSave }) => {
  const [name, setName] = useState(initial?.taskCategoryName || "");
  const [description, setDescription] = useState(initial?.taskCategoryDescription || "");
  const [icon, setIcon] = useState(initial?.iconName || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      taskCategoryName: name.trim(),
      taskCategoryDescription: description.trim(),
      iconName: icon || null,
    });
    if (!ok) setSaving(false);
  };

  return (
    <>
      <ModalBody>
        <VStack space="md">
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Name *</FormControlLabelText></FormControlLabel>
            <Input><InputField placeholder="e.g. Room Cleanliness" value={name} onChangeText={setName} /></Input>
          </FormControl>
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Description (shown to residents)</FormControlLabelText></FormControlLabel>
            <Input><InputField placeholder="What this category rewards" value={description} onChangeText={setDescription} /></Input>
          </FormControl>
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Icon</FormControlLabelText></FormControlLabel>
            <HStack style={{ flexWrap: "wrap", gap: 8 }}>
              {VOUCHER_ICON_OPTIONS.map((option) => {
                const on = icon === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setIcon(option)}
                    accessibilityLabel={option}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: on ? BLUE : "#E5E7EB",
                      backgroundColor: on ? "#E0E7FF" : "#ffffff",
                    }}
                  >
                    <Icon as={getVoucherIcon(option)} size="md" style={{ color: BLUE }} />
                  </Pressable>
                );
              })}
            </HStack>
          </FormControl>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" action="secondary" onPress={onClose} className="mr-3"><ButtonText>Cancel</ButtonText></Button>
        <Button className="bg-indigoscale-700" onPress={save} disabled={saving || !name.trim()}>
          <ButtonText className="text-white">{saving ? "Saving..." : "Save"}</ButtonText>
        </Button>
      </ModalFooter>
    </>
  );
};

const SubtaskFormFields: React.FC<{
  initial: Subtask | null;
  onClose: () => void;
  onSave: (data: SubtaskForm) => Promise<boolean>;
}> = ({ initial, onClose, onSave }) => {
  const [name, setName] = useState(initial?.taskName || "");
  const [description, setDescription] = useState(initial?.taskDescription || "");
  const [points, setPoints] = useState(initial ? String(initial.points) : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      taskName: name.trim(),
      taskDescription: description.trim(),
      points: parseInt(points),
    });
    if (!ok) setSaving(false);
  };

  return (
    <>
      <ModalBody>
        <VStack space="md">
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Name *</FormControlLabelText></FormControlLabel>
            <Input><InputField placeholder="e.g. Room passes weekly inspection" value={name} onChangeText={setName} /></Input>
          </FormControl>
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Description *</FormControlLabelText></FormControlLabel>
            <Input><InputField placeholder="How residents earn it" value={description} onChangeText={setDescription} /></Input>
          </FormControl>
          <FormControl>
            <FormControlLabel><FormControlLabelText className="font-semibold">Points *</FormControlLabelText></FormControlLabel>
            <Input>
              <InputField
                placeholder="Points"
                value={points}
                onChangeText={(v) => setPoints(v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
              />
            </Input>
          </FormControl>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" action="secondary" onPress={onClose} className="mr-3"><ButtonText>Cancel</ButtonText></Button>
        <Button
          className="bg-indigoscale-700"
          onPress={save}
          disabled={saving || !name.trim() || !description.trim() || !points}
        >
          <ButtonText className="text-white">{saving ? "Saving..." : "Save"}</ButtonText>
        </Button>
      </ModalFooter>
    </>
  );
};

const VoucherAdminPage: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [activeTab, setActiveTab] = useState<"categories" | "award">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  // Form modals: null = closed, { item: null } = add, { item } = edit
  const [catModal, setCatModal] = useState<{ item: Category | null } | null>(null);
  const [taskModal, setTaskModal] = useState<{ item: Subtask | null } | null>(null);
  // Stable callbacks so the modal shells don't re-render while typing
  const closeCatModal = useCallback(() => setCatModal(null), []);
  const closeTaskModal = useCallback(() => setTaskModal(null), []);

  // Award flow: category -> subtask -> residents
  const [awardCatId, setAwardCatId] = useState("");
  const [awardTaskId, setAwardTaskId] = useState("");
  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [residentSearch, setResidentSearch] = useState("");
  const [awardResult, setAwardResult] = useState<any>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("taskCategories", { params: { includeTaskCount: "true" } });
      const list: Category[] = res.data.data || [];
      setCategories(list);
      setSelectedCatId((current) => (current && list.some((c) => c.id === current) ? current : list[0]?.id ?? null));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSubtasks = useCallback(async () => {
    try {
      const res = await api.get("tasks", { params: { limit: 500 } });
      setSubtasks(res.data.data?.tasks || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get("users", { params: { role: "resident", includeProfilePicture: "false", limit: 1000 } });
      setResidents(res.data.data?.users || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSubtasks();
    fetchResidents();
  }, [fetchCategories, fetchSubtasks, fetchResidents]);

  const subtasksFor = useCallback(
    (catId: number | null) => subtasks.filter((t) => t.taskCategoryId === catId),
    [subtasks]
  );

  const selectedCat = categories.find((c) => c.id === selectedCatId) || null;

  /* ---------------- category CRUD ---------------- */
  const openNewCategory = () => setCatModal({ item: null });
  const openEditCategory = (cat: Category) => setCatModal({ item: cat });
  const saveCategory = async (data: CategoryForm) => {
    const editing = catModal?.item;
    try {
      if (editing) {
        await api.put(`taskCategories/${editing.id}`, data, { retries: 0 });
      } else {
        const res = await api.post("taskCategories", data, { retries: 0 });
        if (res.data.data?.id) setSelectedCatId(res.data.data.id);
      }
      setCatModal(null);
      setNotice({ ok: true, text: `Category "${data.taskCategoryName}" saved.` });
      fetchCategories();
      return true;
    } catch (e: any) {
      setNotice({ ok: false, text: e?.message || "Could not save the category." });
      return false;
    }
  };
  const askDeleteCategory = (cat: Category) =>
    setConfirm({
      title: `Delete "${cat.taskCategoryName}"?`,
      message: "Only categories without subtasks can be deleted.",
      confirmLabel: "Delete category",
      onConfirm: async () => {
        try {
          await api.delete(`taskCategories/${cat.id}`);
          setNotice({ ok: true, text: `Category "${cat.taskCategoryName}" deleted.` });
          fetchCategories();
        } catch (e: any) {
          setNotice({
            ok: false,
            text: /existing tasks/.test(e?.message || "")
              ? "Remove this category's subtasks before deleting it."
              : e?.message || "Could not delete the category.",
          });
        }
      },
    });

  /* ---------------- subtask CRUD ---------------- */
  const openNewSubtask = () => setTaskModal({ item: null });
  const openEditSubtask = (t: Subtask) => setTaskModal({ item: t });
  const saveSubtask = async (form: SubtaskForm) => {
    if (!selectedCatId) return false;
    const editing = taskModal?.item;
    const data = { ...form, taskCategoryId: selectedCatId };
    try {
      if (editing) {
        await api.put(`tasks/${editing.id}`, data, { retries: 0 });
      } else {
        // taskDate is required by the API; subtasks are reusable so use today
        await api.post("tasks", { ...data, taskDate: new Date().toISOString() }, { retries: 0 });
      }
      setTaskModal(null);
      setNotice({ ok: true, text: `Subtask "${data.taskName}" saved.` });
      fetchSubtasks();
      fetchCategories();
      return true;
    } catch (e: any) {
      setNotice({ ok: false, text: e?.message || "Could not save the subtask." });
      return false;
    }
  };
  const askDeleteSubtask = (t: Subtask) =>
    setConfirm({
      title: `Delete "${t.taskName}"?`,
      message: "Subtasks that have already been awarded can't be deleted.",
      confirmLabel: "Delete subtask",
      onConfirm: async () => {
        try {
          await api.delete(`tasks/${t.id}`);
          setNotice({ ok: true, text: `Subtask "${t.taskName}" deleted.` });
          fetchSubtasks();
          fetchCategories();
        } catch (e: any) {
          setNotice({ ok: false, text: e?.message || "Could not delete the subtask." });
        }
      },
    });

  /* ---------------- award ---------------- */
  const awardSubtasks = subtasksFor(awardCatId ? Number(awardCatId) : null);
  const awardTask = subtasks.find((t) => String(t.id) === awardTaskId) || null;

  const filteredResidents = useMemo(() => {
    const q = residentSearch.trim().toLowerCase();
    return residents.filter(
      (r) => !q || r.userName.toLowerCase().includes(q) || (r.resident?.serialNumber || "").toLowerCase().includes(q)
    );
  }, [residents, residentSearch]);

  const toggleResident = (id: number) =>
    setSelectedResidents((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const allVisibleSelected =
    filteredResidents.length > 0 && filteredResidents.every((r) => selectedResidents.includes(r.id));
  const toggleAllVisible = () =>
    setSelectedResidents((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !filteredResidents.some((r) => r.id === id))
        : [...new Set([...prev, ...filteredResidents.map((r) => r.id)])]
    );

  const award = async () => {
    if (!awardTask || selectedResidents.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post(
        "transactions/completion/bulk",
        { userIds: selectedResidents, tasks: [{ id: awardTask.id }] },
        { retries: 0 }
      );
      setAwardResult(res.data.data);
      setSelectedResidents([]);
      fetchResidents();
    } catch (e: any) {
      setNotice({ ok: false, text: e?.message || "Could not award points." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- excel ---------------- */
  const downloadExcel = async (url: string, filename: string) => {
    try {
      const res = await api.get(url, { responseType: "arrayBuffer" });
      if (Platform.OS === "web") {
        const blob = new Blob([res.data as any], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const bytes = new Uint8Array(res.data as any);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const { File, Paths } = await import("expo-file-system/next");
        const Sharing = await import("expo-sharing");
        const file = new File(Paths.cache, filename);
        await file.write(btoa(binary), { encoding: "base64" });
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Records",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (e: any) {
      setNotice({ ok: false, text: "Download failed: " + (e?.message || "") });
    }
  };

  const tabClass = (on: boolean) => (on ? "bg-indigoscale-700 border-indigoscale-700" : "bg-white border-indigoscale-300");
  const tabText = (on: boolean) => (on ? "text-white" : "text-indigoscale-700");

  return (
    <VStack className="flex-1 bg-indigoscale-100" style={{ padding: isMobile ? 12 : 20 }}>
      {/* Tabs */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <Button variant="outline" className={tabClass(activeTab === "categories")} onPress={() => setActiveTab("categories")}>
          <ButtonText className={tabText(activeTab === "categories")}>Categories & Subtasks</ButtonText>
        </Button>
        <Button variant="outline" className={tabClass(activeTab === "award")} onPress={() => setActiveTab("award")}>
          <ButtonText className={tabText(activeTab === "award")}>Award Points</ButtonText>
        </Button>
        <View style={{ flex: 1 }} />
        <Button className="bg-greenscale-700" onPress={() => downloadExcel("export/all", "all_records.xlsx")}>
          <ButtonIcon as={Download} className="text-white" />
          <ButtonText className="text-white">Export Excel</ButtonText>
        </Button>
      </View>

      {notice && (
        <HStack
          className="items-center justify-between rounded-lg px-3 py-2 mb-3"
          style={{ backgroundColor: notice.ok ? "#DCFCE7" : "#FEE2E2" }}
        >
          <Text style={{ color: notice.ok ? "#166534" : "#991B1B", flex: 1 }}>{notice.text}</Text>
          <Pressable onPress={() => setNotice(null)}>
            <Icon as={X} size="sm" style={{ color: notice.ok ? "#166534" : "#991B1B" }} />
          </Pressable>
        </HStack>
      )}

      {/* ---------------- CATEGORIES & SUBTASKS ---------------- */}
      {activeTab === "categories" && (
        <View style={{ flex: 1, flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          {/* Category list */}
          <VStack className="bg-white rounded-2xl p-4" style={{ width: isMobile ? "100%" : 320, maxHeight: isMobile ? 320 : undefined }}>
            <HStack className="justify-between items-center mb-3">
              <Heading size="md" style={{ color: BLUE }}>Categories</Heading>
              <Button size="sm" className="bg-indigoscale-700" onPress={openNewCategory}>
                <ButtonIcon as={Plus} className="text-white" />
                <ButtonText className="text-white">Add</ButtonText>
              </Button>
            </HStack>
            <ScrollView>
              {categories.map((cat) => {
                const on = cat.id === selectedCatId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCatId(cat.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      borderRadius: 10,
                      marginBottom: 4,
                      backgroundColor: on ? "#E0E7FF" : "transparent",
                    }}
                  >
                    <Icon as={getVoucherIcon(cat.iconName)} size="md" style={{ color: BLUE }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: "#1c2340" }}>{cat.taskCategoryName}</Text>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {subtasksFor(cat.id).length} subtask{subtasksFor(cat.id).length === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {categories.length === 0 && <Text style={{ color: "#6B7280" }}>No categories yet.</Text>}
            </ScrollView>
          </VStack>

          {/* Selected category + its subtasks */}
          <VStack className="flex-1 bg-white rounded-2xl p-4" space="md">
            {selectedCat ? (
              <>
                <HStack className="justify-between items-start" style={{ flexWrap: "wrap", gap: 8 }}>
                  <HStack space="sm" className="items-center flex-1">
                    <Icon as={getVoucherIcon(selectedCat.iconName)} size="xl" style={{ color: BLUE }} />
                    <VStack className="flex-1">
                      <Heading size="lg" style={{ color: BLUE }}>{selectedCat.taskCategoryName}</Heading>
                      <Text style={{ color: "#6B7280" }}>{selectedCat.taskCategoryDescription || "No description"}</Text>
                    </VStack>
                  </HStack>
                  <HStack space="md" className="items-center">
                    <Pressable onPress={() => openEditCategory(selectedCat)} accessibilityLabel="Edit category">
                      <Icon as={Pencil} size="md" className="text-indigoscale-700" />
                    </Pressable>
                    <Pressable
                      onPress={() => downloadExcel(`export/category/${selectedCat.id}`, `${selectedCat.taskCategoryName}.xlsx`)}
                      accessibilityLabel="Export category"
                    >
                      <Icon as={Download} size="md" className="text-greenscale-700" />
                    </Pressable>
                    <Pressable onPress={() => askDeleteCategory(selectedCat)} accessibilityLabel="Delete category">
                      <Icon as={Trash} size="md" className="text-redscale-700" />
                    </Pressable>
                  </HStack>
                </HStack>

                <HStack className="justify-between items-center">
                  <Heading size="md" className="text-indigoscale-900">Subtasks</Heading>
                  <Button size="sm" className="bg-indigoscale-700" onPress={openNewSubtask}>
                    <ButtonIcon as={Plus} className="text-white" />
                    <ButtonText className="text-white">Add subtask</ButtonText>
                  </Button>
                </HStack>

                <ScrollView>
                  {subtasksFor(selectedCat.id).length === 0 ? (
                    <Text style={{ color: "#6B7280" }}>No subtasks yet. Add one to start awarding points.</Text>
                  ) : (
                    subtasksFor(selectedCat.id).map((t) => (
                      <HStack
                        key={t.id}
                        className="items-center py-3"
                        style={{ borderBottomWidth: 1, borderColor: "#F3F4F6", gap: 12 }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: "#1c2340" }}>{t.taskName}</Text>
                          {!!t.taskDescription && (
                            <Text style={{ fontSize: 13, color: "#6B7280" }}>{t.taskDescription}</Text>
                          )}
                        </View>
                        <Text style={{ fontWeight: "800", color: BLUE }}>{t.points} pts</Text>
                        <Pressable onPress={() => openEditSubtask(t)} accessibilityLabel="Edit subtask">
                          <Icon as={Pencil} size="sm" className="text-indigoscale-700" />
                        </Pressable>
                        <Pressable onPress={() => askDeleteSubtask(t)} accessibilityLabel="Delete subtask">
                          <Icon as={Trash} size="sm" className="text-redscale-700" />
                        </Pressable>
                      </HStack>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              <Text style={{ color: "#6B7280" }}>Add a category to get started.</Text>
            )}
          </VStack>
        </View>
      )}

      {/* ---------------- AWARD POINTS ---------------- */}
      {activeTab === "award" && (
        <View style={{ flex: 1, flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          {/* Step 1 + 2: category and subtask */}
          <VStack className="bg-white rounded-2xl p-4" space="md" style={{ width: isMobile ? "100%" : 360 }}>
            <Heading size="md" style={{ color: BLUE }}>1. Choose the voucher</Heading>
            <VStack space="xs">
              <Text style={{ fontWeight: "700", color: "#1c2340" }}>Category</Text>
              <DropdownSelect
                value={awardCatId}
                onChange={(v) => {
                  setAwardCatId(v);
                  setAwardTaskId("");
                }}
                placeholder="Select a category"
                options={categories.map((c) => ({ label: c.taskCategoryName, value: String(c.id) }))}
              />
            </VStack>
            <VStack space="xs">
              <Text style={{ fontWeight: "700", color: "#1c2340" }}>Subtask</Text>
              {awardCatId && awardSubtasks.length === 0 ? (
                <Text style={{ color: "#6B7280" }}>This category has no subtasks yet.</Text>
              ) : (
                <DropdownSelect
                  value={awardTaskId}
                  onChange={setAwardTaskId}
                  placeholder={awardCatId ? "Select a subtask" : "Choose a category first"}
                  options={awardSubtasks.map((t) => ({ label: `${t.taskName} · ${t.points} pts`, value: String(t.id) }))}
                />
              )}
            </VStack>

            <VStack className="rounded-xl p-3" style={{ backgroundColor: "#EEF1F7" }} space="xs">
              <Text style={{ color: "#1c2340" }}>
                Residents selected: <Text style={{ fontWeight: "800" }}>{selectedResidents.length}</Text>
              </Text>
              <Text style={{ color: "#1c2340" }}>
                Points each: <Text style={{ fontWeight: "800" }}>{awardTask ? awardTask.points : "—"}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: "#dc2626" }}>
                Residents marked Abscondence or FTR are skipped automatically.
              </Text>
            </VStack>

            <Button
              className="bg-indigoscale-700"
              onPress={award}
              disabled={submitting || !awardTask || selectedResidents.length === 0}
            >
              <ButtonIcon as={Award} className="text-white" />
              <ButtonText className="text-white">{submitting ? "Awarding..." : "Award points"}</ButtonText>
            </Button>
          </VStack>

          {/* Step 3: residents */}
          <VStack className="flex-1 bg-white rounded-2xl p-4" space="sm" style={{ minHeight: 360 }}>
            <HStack className="justify-between items-center" style={{ flexWrap: "wrap", gap: 8 }}>
              <Heading size="md" style={{ color: BLUE }}>2. Choose residents</Heading>
              <Button size="sm" variant="outline" onPress={toggleAllVisible}>
                <ButtonText>{allVisibleSelected ? "Deselect all" : "Select all"}</ButtonText>
              </Button>
            </HStack>
            <HStack className="items-center rounded-lg px-3 border border-gray-300">
              <Icon as={Search} size="sm" className="text-gray-400" />
              <Input className="flex-1 border-0">
                <InputField placeholder="Search name or serial number" value={residentSearch} onChangeText={setResidentSearch} />
              </Input>
            </HStack>
            <ScrollView>
              {filteredResidents.map((r) => {
                const on = selectedResidents.includes(r.id);
                const remarks = r.resident?.remarks;
                const ineligible = remarks === "abscondence" || remarks === "ftr";
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => toggleResident(r.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 10,
                      borderBottomWidth: 1,
                      borderColor: "#F3F4F6",
                      backgroundColor: on ? "#E0E7FF" : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: on ? BLUE : "#CBD5E1",
                        backgroundColor: on ? BLUE : "transparent",
                        marginRight: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on && <Icon as={Check} size="xs" className="text-white" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: "#1c2340" }}>{r.userName}</Text>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {r.resident?.serialNumber ? `${r.resident.serialNumber} · ` : ""}
                        {r.resident?.currentPoints ?? 0} pts
                      </Text>
                    </View>
                    {ineligible && (
                      <View style={{ backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 8 }}>
                        <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>{remarks === "ftr" ? "FTR" : "ABS"}</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => downloadExcel(`export/resident/${r.id}`, `${r.userName}.xlsx`)}
                      accessibilityLabel={`Download ${r.userName}'s records`}
                      hitSlop={8}
                    >
                      <Icon as={Download} size="xs" className="text-greenscale-700" />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          </VStack>
        </View>
      )}

      {/* CATEGORY MODAL (keyed so it starts fresh each time it opens) */}
      {catModal && (
        <FormModalShell
          key={catModal.item?.id ?? "new"}
          title={`${catModal.item ? "Edit" : "Add"} category`}
          onClose={closeCatModal}
        >
          <CategoryFormFields initial={catModal.item} onClose={closeCatModal} onSave={saveCategory} />
        </FormModalShell>
      )}

      {/* SUBTASK MODAL */}
      {taskModal && selectedCat && (
        <FormModalShell
          key={taskModal.item?.id ?? "new"}
          title={`${taskModal.item ? "Edit" : "Add"} subtask · ${selectedCat.taskCategoryName}`}
          onClose={closeTaskModal}
        >
          <SubtaskFormFields initial={taskModal.item} onClose={closeTaskModal} onSave={saveSubtask} />
        </FormModalShell>
      )}

      {/* AWARD RESULT */}
      <Modal isOpen={!!awardResult} onClose={() => setAwardResult(null)} size="lg">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg" className="text-indigoscale-700">Award results</Heading>
            <ModalCloseButton><Icon as={X} size="md" /></ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            {awardResult && (
              <VStack space="md">
                <HStack space="md">
                  {[
                    ["Awarded", awardResult.successCount, "#DCFCE7", "#166534"],
                    ["Skipped", awardResult.skippedCount, "#FEF3C7", "#92400E"],
                    ["Failed", awardResult.failedCount, "#FEE2E2", "#991B1B"],
                  ].map(([label, count, bg, fg]) => (
                    <View key={label} style={{ backgroundColor: bg, padding: 12, borderRadius: 8, flex: 1 }}>
                      <Text style={{ fontSize: 24, fontWeight: "bold", color: fg }}>{count ?? 0}</Text>
                      <Text style={{ color: fg, fontSize: 12 }}>{label}</Text>
                    </View>
                  ))}
                </HStack>
                {awardResult.results?.skipped?.length > 0 && (
                  <VStack>
                    <Text style={{ fontWeight: "bold", color: "#92400E", marginBottom: 4 }}>Skipped (not entitled):</Text>
                    {awardResult.results.skipped.map((s: any, i: number) => (
                      <Text key={i} style={{ fontSize: 13, color: "#92400E" }}>• {s.userName}: {s.reason}</Text>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button className="bg-indigoscale-700" onPress={() => setAwardResult(null)}><ButtonText className="text-white">Close</ButtonText></Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CONFIRM */}
      <alert.AlertDialog isOpen={!!confirm} onClose={() => setConfirm(null)}>
        <alert.AlertDialogBackdrop />
        <alert.AlertDialogContent>
          <alert.AlertDialogHeader><Heading size="md">{confirm?.title}</Heading></alert.AlertDialogHeader>
          <alert.AlertDialogBody><Text>{confirm?.message}</Text></alert.AlertDialogBody>
          <alert.AlertDialogFooter>
            <Button variant="outline" action="secondary" className="mr-3" onPress={() => setConfirm(null)}><ButtonText>Cancel</ButtonText></Button>
            <Button
              action="negative"
              onPress={async () => {
                const action = confirm;
                setConfirm(null);
                if (action) await action.onConfirm();
              }}
            >
              <ButtonText>{confirm?.confirmLabel}</ButtonText>
            </Button>
          </alert.AlertDialogFooter>
        </alert.AlertDialogContent>
      </alert.AlertDialog>
    </VStack>
  );
};

export default VoucherAdminPage;
