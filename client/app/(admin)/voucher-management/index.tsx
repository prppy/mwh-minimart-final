import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { DataTable } from "react-native-paper";
import { Plus, X, Pencil, Download, Trash, Check, Tag, Gift, Star, Award, Heart, Zap, Shield, BookOpen, Coffee, Music, Smile, Sun, Moon, Cloud, Flame, Anchor, Bell, Camera, Compass, Feather, Key, Map } from "lucide-react-native";
import api from "@/utils/api";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@/components/ui/modal";
import { Select, SelectTrigger, SelectInput, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from "@/components/ui/select";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";

const ICON_MAP: Record<string, any> = { tag: Tag, gift: Gift, star: Star, award: Award, heart: Heart, zap: Zap, shield: Shield, book: BookOpen, coffee: Coffee, music: Music, smile: Smile, sun: Sun, moon: Moon, cloud: Cloud, flame: Flame, anchor: Anchor, bell: Bell, camera: Camera, compass: Compass, feather: Feather, key: Key, map: Map };
const ICON_OPTIONS = Object.keys(ICON_MAP);

type Category = { id: number; taskCategoryName: string; taskCategoryDescription: string; iconName?: string; _count?: { tasks: number } };
type Task = { id: number; taskName: string; taskDescription: string; points: number; taskCategoryId: number; imageUrl?: string; taskCategory?: { taskCategoryName: string } };
type Resident = { id: number; userName: string; resident?: { serialNumber?: string; isActive?: boolean; remarks?: string; currentPoints?: number } };

const VoucherAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"categories" | "vouchers" | "award">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("");

  // Voucher modal
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editVoucherId, setEditVoucherId] = useState<number | null>(null);
  const [vName, setVName] = useState("");
  const [vDesc, setVDesc] = useState("");
  const [vPoints, setVPoints] = useState("");
  const [vCatId, setVCatId] = useState("");

  // Award state
  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [awardResult, setAwardResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/taskCategories?includeTaskCount=true");
      setCategories(res.data.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get("/tasks?limit=200");
      setTasks(res.data.data?.tasks || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get("/users?role=resident&limit=200");
      setResidents(res.data.data?.users || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchCategories(); fetchTasks(); fetchResidents(); }, []);

  // Category CRUD
  const handleSaveCategory = async () => {
    setSubmitting(true);
    try {
      const data: any = { taskCategoryName: catName, taskCategoryDescription: catDesc, iconName: catIcon || null };
      if (editCatId) {
        await api.put(`/taskCategories/${editCatId}`, data);
      } else {
        await api.post("/taskCategories", data);
      }
      setShowCatModal(false); resetCatForm(); fetchCategories();
    } catch (e: any) { alert(e.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try { await api.delete(`/taskCategories/${id}`); fetchCategories(); }
    catch (e: any) { alert(e.message || "Cannot delete"); }
  };

  const openEditCategory = (cat: Category) => {
    setEditCatId(cat.id); setCatName(cat.taskCategoryName || ""); setCatDesc(cat.taskCategoryDescription || ""); setCatIcon(cat.iconName || ""); setShowCatModal(true);
  };

  const resetCatForm = () => { setEditCatId(null); setCatName(""); setCatDesc(""); setCatIcon(""); };

  // Voucher (Task) CRUD
  const handleSaveVoucher = async () => {
    setSubmitting(true);
    try {
      const data: any = { taskName: vName, taskDescription: vDesc, points: parseInt(vPoints), taskCategoryId: parseInt(vCatId), taskDate: new Date().toISOString() };
      if (editVoucherId) {
        await api.put(`/tasks/${editVoucherId}`, data);
      } else {
        await api.post("/tasks", data);
      }
      setShowVoucherModal(false); resetVoucherForm(); fetchTasks();
    } catch (e: any) { alert(e.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const openEditVoucher = (t: Task) => {
    setEditVoucherId(t.id); setVName(t.taskName); setVDesc(t.taskDescription || ""); setVPoints(String(t.points)); setVCatId(String(t.taskCategoryId)); setShowVoucherModal(true);
  };

  const resetVoucherForm = () => { setEditVoucherId(null); setVName(""); setVDesc(""); setVPoints(""); setVCatId(""); };

  // Bulk Award
  const toggleResident = (id: number) => {
    setSelectedResidents(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleTask = (id: number) => {
    setSelectedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const selectAllResidents = () => {
    if (selectedResidents.length === residents.length) { setSelectedResidents([]); }
    else { setSelectedResidents(residents.map(r => r.id)); }
  };

  const handleBulkAward = async () => {
    if (selectedResidents.length === 0 || selectedTasks.length === 0) {
      alert("Please select at least one resident and one voucher"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/transactions/completion/bulk", {
        userIds: selectedResidents, tasks: selectedTasks.map(id => ({ id }))
      });
      setAwardResult(res.data.data);
      setShowResultModal(true);
      setSelectedResidents([]);
      setSelectedTasks([]);
      fetchResidents();
    } catch (e: any) { alert(e.message || "Bulk award failed"); }
    finally { setSubmitting(false); }
  };

  // CSV Download
  const downloadCSV = async (url: string, fallbackName: string) => {
    try {
      const res = await api.get(url, { responseType: "text" as any });
      const blob = new Blob([res.data as any], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fallbackName;
      link.click();
    } catch (e: any) { alert("Download failed: " + (e.message || "")); }
  };

  const getIconComponent = (name?: string) => ICON_MAP[name || ""] || Tag;

  // Tab button style helper
  const tabBtn = (tab: string, current: string) => current === tab ? "bg-indigoscale-700" : "";
  const tabTxt = (tab: string, current: string) => current === tab ? "text-white" : "text-indigoscale-700";

  return (
    <VStack className="flex-1 p-5 bg-indigoscale-500">
      {/* TABS */}
      <HStack space="md" className="mb-4">
        {(["categories", "vouchers", "award"] as const).map(tab => (
          <Button key={tab} action="secondary" className={tabBtn(tab, activeTab)} onPress={() => setActiveTab(tab)}>
            <ButtonText className={tabTxt(tab, activeTab)}>{tab === "categories" ? "Categories" : tab === "vouchers" ? "Vouchers" : "Award Points"}</ButtonText>
          </Button>
        ))}
        <View style={{ flex: 1 }} />
        <Button action="primary" className="bg-greenscale-700" onPress={() => downloadCSV("/export/all", "all_records.csv")}>
          <ButtonIcon as={Download} className="text-white" />
          <ButtonText className="text-white">Download All</ButtonText>
        </Button>
      </HStack>

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <VStack className="flex-1">
          <HStack className="justify-between mb-3">
            <Heading size="lg" className="text-white">Voucher Categories</Heading>
            <Button className="bg-indigoscale-700" onPress={() => { resetCatForm(); setShowCatModal(true); }}>
              <ButtonIcon as={Plus} className="text-white" /><ButtonText className="text-white">Add Category</ButtonText>
            </Button>
          </HStack>
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <DataTable>
              <DataTable.Header style={{ backgroundColor: "#E6E6FA" }}>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Icon</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Name</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Description</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Vouchers</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Actions</DataTable.Title>
              </DataTable.Header>
              <ScrollView>{categories.map((cat, i) => (
                <DataTable.Row key={i} style={{ backgroundColor: "#fff" }}>
                  <DataTable.Cell><Icon as={getIconComponent(cat.iconName)} size="md" className="text-indigoscale-700" /></DataTable.Cell>
                  <DataTable.Cell>{cat.taskCategoryName}</DataTable.Cell>
                  <DataTable.Cell>{cat.taskCategoryDescription || "—"}</DataTable.Cell>
                  <DataTable.Cell>{cat._count?.tasks ?? 0}</DataTable.Cell>
                  <DataTable.Cell>
                    <HStack space="md">
                      <Pressable onPress={() => openEditCategory(cat)}><Icon as={Pencil} size="sm" className="text-indigoscale-700" /></Pressable>
                      <Pressable onPress={() => handleDeleteCategory(cat.id)}><Icon as={Trash} size="sm" className="text-redscale-700" /></Pressable>
                      <Pressable onPress={() => downloadCSV(`/export/category/${cat.id}`, `${cat.taskCategoryName}.csv`)}><Icon as={Download} size="sm" className="text-greenscale-700" /></Pressable>
                    </HStack>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}</ScrollView>
            </DataTable>
          </View>
        </VStack>
      )}

      {/* VOUCHERS TAB */}
      {activeTab === "vouchers" && (
        <VStack className="flex-1">
          <HStack className="justify-between mb-3">
            <Heading size="lg" className="text-white">Vouchers</Heading>
            <Button className="bg-indigoscale-700" onPress={() => { resetVoucherForm(); setShowVoucherModal(true); }}>
              <ButtonIcon as={Plus} className="text-white" /><ButtonText className="text-white">Add Voucher</ButtonText>
            </Button>
          </HStack>
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <DataTable>
              <DataTable.Header style={{ backgroundColor: "#E6E6FA" }}>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Name</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Description</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Category</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Points</DataTable.Title>
                <DataTable.Title textStyle={{ fontWeight: "bold" }}>Actions</DataTable.Title>
              </DataTable.Header>
              <ScrollView>{tasks.map((t, i) => (
                <DataTable.Row key={i} style={{ backgroundColor: "#fff" }}>
                  <DataTable.Cell>{t.taskName}</DataTable.Cell>
                  <DataTable.Cell>{t.taskDescription || "—"}</DataTable.Cell>
                  <DataTable.Cell>{t.taskCategory?.taskCategoryName || "—"}</DataTable.Cell>
                  <DataTable.Cell>{t.points} pts</DataTable.Cell>
                  <DataTable.Cell>
                    <Pressable onPress={() => openEditVoucher(t)}><Icon as={Pencil} size="sm" className="text-indigoscale-700" /></Pressable>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}</ScrollView>
            </DataTable>
          </View>
        </VStack>
      )}

      {/* AWARD TAB */}
      {activeTab === "award" && (
        <HStack className="flex-1 gap-4">
          {/* Residents list */}
          <VStack className="flex-1 bg-white rounded-xl p-4" style={{ maxHeight: 600 }}>
            <HStack className="justify-between mb-2">
              <Heading size="md">Select Residents</Heading>
              <Button size="sm" variant="outline" onPress={selectAllResidents}>
                <ButtonText>{selectedResidents.length === residents.length ? "Deselect All" : "Select All"}</ButtonText>
              </Button>
            </HStack>
            <ScrollView>{residents.map((r) => {
              const isSelected = selectedResidents.includes(r.id);
              const remarks = r.resident?.remarks;
              const isIneligible = remarks === "abscondence" || remarks === "ftr";
              return (
                <Pressable key={r.id} onPress={() => toggleResident(r.id)} style={{ flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: isSelected ? "#e0e7ff" : "transparent" }}>
                  <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: isSelected ? "#4338ca" : "#ccc", backgroundColor: isSelected ? "#4338ca" : "transparent", marginRight: 12, justifyContent: "center", alignItems: "center" }}>
                    {isSelected && <Icon as={Check} size="xs" className="text-white" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600" }}>{r.userName}</Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>{r.resident?.serialNumber || ""} · {r.resident?.currentPoints ?? 0} pts</Text>
                  </View>
                  {isIneligible && (
                    <View style={{ backgroundColor: "#fef2f2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                      <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "600" }}>{remarks === "ftr" ? "FTR" : "ABS"}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}</ScrollView>
          </VStack>

          {/* Vouchers + Award button */}
          <VStack className="flex-1 gap-4">
            <VStack className="bg-white rounded-xl p-4" style={{ maxHeight: 400 }}>
              <Heading size="md" className="mb-2">Select Vouchers</Heading>
              <ScrollView>{tasks.map((t) => {
                const isSelected = selectedTasks.includes(t.id);
                return (
                  <Pressable key={t.id} onPress={() => toggleTask(t.id)} style={{ flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: isSelected ? "#e0e7ff" : "transparent" }}>
                    <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: isSelected ? "#4338ca" : "#ccc", backgroundColor: isSelected ? "#4338ca" : "transparent", marginRight: 12, justifyContent: "center", alignItems: "center" }}>
                      {isSelected && <Icon as={Check} size="xs" className="text-white" />}
                    </View>
                    <Text style={{ flex: 1, fontWeight: "500" }}>{t.taskName}</Text>
                    <Text style={{ color: "#4338ca", fontWeight: "600" }}>{t.points} pts</Text>
                  </Pressable>
                );
              })}</ScrollView>
            </VStack>

            <VStack className="bg-white rounded-xl p-4 gap-2">
              <Text style={{ fontSize: 14, color: "#666" }}>Selected: {selectedResidents.length} residents, {selectedTasks.length} vouchers</Text>
              <Text style={{ fontSize: 14, color: "#666" }}>Total points per resident: {tasks.filter(t => selectedTasks.includes(t.id)).reduce((s, t) => s + t.points, 0)} pts</Text>
              <Text style={{ fontSize: 12, color: "#dc2626" }}>⚠ Residents with Abscondence/FTR will be automatically skipped</Text>
              <Button className="bg-indigoscale-700 mt-2" onPress={handleBulkAward} isDisabled={submitting || selectedResidents.length === 0 || selectedTasks.length === 0}>
                <ButtonIcon as={Award} className="text-white" />
                <ButtonText className="text-white">{submitting ? "Awarding..." : "Award Points"}</ButtonText>
              </Button>
            </VStack>

            {/* Per-resident download */}
            <VStack className="bg-white rounded-xl p-4">
              <Heading size="sm" className="mb-2">Download Individual Records</Heading>
              <ScrollView style={{ maxHeight: 150 }}>{residents.slice(0, 20).map(r => (
                <Pressable key={r.id} onPress={() => downloadCSV(`/export/resident/${r.id}`, `${r.userName}.csv`)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#f3f4f6" }}>
                  <Text style={{ fontSize: 13 }}>{r.userName}</Text>
                  <Icon as={Download} size="xs" className="text-greenscale-700" />
                </Pressable>
              ))}</ScrollView>
            </VStack>
          </VStack>
        </HStack>
      )}

      {/* CATEGORY MODAL */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} size="lg">
        <ModalBackdrop /><ModalContent>
          <ModalHeader><Heading size="lg" className="text-indigoscale-700">{editCatId ? "Edit" : "Add"} Category</Heading><ModalCloseButton><Icon as={X} size="md" /></ModalCloseButton></ModalHeader>
          <ModalBody>
            <VStack space="md">
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Name *</FormControlLabelText></FormControlLabel><Input className="bg-background-50"><InputField placeholder="Category name" value={catName} onChangeText={setCatName} /></Input></FormControl>
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Description</FormControlLabelText></FormControlLabel><Input className="bg-background-50"><InputField placeholder="Description" value={catDesc} onChangeText={setCatDesc} /></Input></FormControl>
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Icon</FormControlLabelText></FormControlLabel>
                <Select selectedValue={catIcon} onValueChange={setCatIcon}><SelectTrigger className="bg-background-50"><SelectInput placeholder="Select icon" /></SelectTrigger><SelectPortal><SelectBackdrop /><SelectContent><SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>{ICON_OPTIONS.map(ic => <SelectItem key={ic} label={ic.charAt(0).toUpperCase() + ic.slice(1)} value={ic} />)}</SelectContent></SelectPortal></Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setShowCatModal(false)} className="mr-3"><ButtonText>Cancel</ButtonText></Button>
            <Button className="bg-indigoscale-700" onPress={handleSaveCategory} isDisabled={submitting || !catName}><ButtonText className="text-white">{submitting ? "Saving..." : "Save"}</ButtonText></Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* VOUCHER MODAL */}
      <Modal isOpen={showVoucherModal} onClose={() => setShowVoucherModal(false)} size="lg">
        <ModalBackdrop /><ModalContent>
          <ModalHeader><Heading size="lg" className="text-indigoscale-700">{editVoucherId ? "Edit" : "Add"} Voucher</Heading><ModalCloseButton><Icon as={X} size="md" /></ModalCloseButton></ModalHeader>
          <ModalBody>
            <VStack space="md">
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Name *</FormControlLabelText></FormControlLabel><Input className="bg-background-50"><InputField placeholder="Voucher name" value={vName} onChangeText={setVName} /></Input></FormControl>
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Description *</FormControlLabelText></FormControlLabel><Input className="bg-background-50"><InputField placeholder="Description" value={vDesc} onChangeText={setVDesc} /></Input></FormControl>
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Points *</FormControlLabelText></FormControlLabel><Input className="bg-background-50"><InputField placeholder="Points" value={vPoints} onChangeText={setVPoints} keyboardType="numeric" /></Input></FormControl>
              <FormControl><FormControlLabel><FormControlLabelText className="font-semibold">Category *</FormControlLabelText></FormControlLabel>
                <Select selectedValue={vCatId} onValueChange={setVCatId}><SelectTrigger className="bg-background-50"><SelectInput placeholder="Select category" /></SelectTrigger><SelectPortal><SelectBackdrop /><SelectContent><SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>{categories.map(c => <SelectItem key={c.id} label={c.taskCategoryName || ""} value={String(c.id)} />)}</SelectContent></SelectPortal></Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setShowVoucherModal(false)} className="mr-3"><ButtonText>Cancel</ButtonText></Button>
            <Button className="bg-indigoscale-700" onPress={handleSaveVoucher} isDisabled={submitting || !vName || !vDesc || !vPoints || !vCatId}><ButtonText className="text-white">{submitting ? "Saving..." : "Save"}</ButtonText></Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* BULK AWARD RESULT MODAL */}
      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} size="lg">
        <ModalBackdrop /><ModalContent>
          <ModalHeader><Heading size="lg" className="text-indigoscale-700">Award Results</Heading><ModalCloseButton><Icon as={X} size="md" /></ModalCloseButton></ModalHeader>
          <ModalBody>
            {awardResult && (
              <VStack space="md">
                <HStack space="lg">
                  <View style={{ backgroundColor: "#dcfce7", padding: 12, borderRadius: 8, flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#166534" }}>{awardResult.successCount}</Text>
                    <Text style={{ color: "#166534", fontSize: 12 }}>Awarded</Text>
                  </View>
                  <View style={{ backgroundColor: "#fef3c7", padding: 12, borderRadius: 8, flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#92400e" }}>{awardResult.skippedCount}</Text>
                    <Text style={{ color: "#92400e", fontSize: 12 }}>Skipped</Text>
                  </View>
                  <View style={{ backgroundColor: "#fee2e2", padding: 12, borderRadius: 8, flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#991b1b" }}>{awardResult.failedCount}</Text>
                    <Text style={{ color: "#991b1b", fontSize: 12 }}>Failed</Text>
                  </View>
                </HStack>
                {awardResult.results?.skipped?.length > 0 && (
                  <VStack>
                    <Text style={{ fontWeight: "bold", color: "#92400e", marginBottom: 4 }}>Skipped (Not Entitled):</Text>
                    {awardResult.results.skipped.map((s: any, i: number) => (
                      <Text key={i} style={{ fontSize: 13, color: "#92400e" }}>• {s.userName}: {s.reason}</Text>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button className="bg-indigoscale-700" onPress={() => setShowResultModal(false)}><ButtonText className="text-white">Close</ButtonText></Button></ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default VoucherAdminPage;
