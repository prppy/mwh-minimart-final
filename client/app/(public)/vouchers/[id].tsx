import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import * as lucideReactNative from "lucide-react-native";

import api, { ApiError } from "@/utils/api";
import { TaskCategory, Voucher } from "@/utils/types";
import { useAuth } from "@/contexts/auth-context";

import Spinner from "@/components/custom-spinner";

import * as alert from "@/components/ui/alert-dialog";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import * as select from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import ErrorDialogue from "@/components/dialogue/custom-error-dialogue";
import DiscardDialogue from "@/components/dialogue/custom-discard-dialogue";
import { Image } from "react-native";

// Dummy data
const DUMMY_TASK_CATEGORIES: TaskCategory[] = [
  { id: 1, taskCategoryName: "Cleaning", taskCategoryDescription: "Cleaning tasks" },
  { id: 2, taskCategoryName: "Cooking", taskCategoryDescription: "Cooking tasks" },
  { id: 3, taskCategoryName: "Laundry", taskCategoryDescription: "Laundry tasks" },
  { id: 4, taskCategoryName: "Gardening", taskCategoryDescription: "Gardening tasks" },
];

const DUMMY_VOUCHER: Voucher = {
  id: 1,
  taskName: "Sample Task",
  taskDescription: "This is a sample task description. The actual task data could not be loaded.",
  taskCategoryId: 1,
  taskCategory: {
    id: 1,
    taskCategoryName: "Cleaning",
    taskCategoryDescription: "Cleaning tasks",
  },
  imageUrl: "https://picsum.photos/seed/sample/400/300",
  points: 500,
  completions: [],
  _count: { completions: 0 },
};

const VoucherDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [tempVoucher, setTempVoucher] = useState<Voucher | null>(null);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [editing, setEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // error handling
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogHeading, setErrorDialogHeading] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  const isNew = id === "0";

  useEffect(() => {
    const fetchVoucher = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        if (!isNew) {
          const res = await api.get(`tasks/${id}`);
          const data = res.data.data;
          setVoucher(data);
          setTempVoucher({ ...data });
        } else {
          const emptyVoucher: Voucher = {
            id: 0,
            taskName: "",
            taskDescription: "",
            taskCategoryId: 0,
            taskCategory: {
              id: 0,
              taskCategoryName: "",
              taskCategoryDescription: "",
            },
            imageUrl: "",
            points: 0,
            completions: [],
            _count: { completions: 0 },
          };
          setVoucher(emptyVoucher);
          setTempVoucher({ ...emptyVoucher });
          setEditing(true);
        }
      } catch (error) {
        console.error("Error fetching voucher:", error);
        setLoadError(true);
        // Set dummy data as fallback
        setVoucher(DUMMY_VOUCHER);
        setTempVoucher({ ...DUMMY_VOUCHER });
      } finally {
        setLoading(false);
      }
    };

    const fetchTaskCategories = async () => {
      try {
        const response = await api.get("taskCategories");
        console.log("Fetched task categories:", response.data.data);
        setTaskCategories(response.data.data || []);
      } catch (err) {
        console.error("Error fetching task categories:", err);
        // Set dummy categories as fallback
        setTaskCategories(DUMMY_TASK_CATEGORIES);
      }
    };

    fetchVoucher();
    fetchTaskCategories();
  }, [id, isNew]);

  const handleSave = async () => {
    try {
      if (!tempVoucher) return;

      let res;

      if (isNew) {
        res = await api.post("tasks", {
          ...tempVoucher,
          imageUrl: tempVoucher.imageUrl || undefined,
        });
      } else {
        const {
          id: _ignored,
          taskCategory: _ignored2,
          completions: _ignored3,
          _count: _ignored4,
          ...body
        } = tempVoucher;
        console.log("Updating voucher with body:", body);
        res = await api.put(`tasks/${id}`, {
          ...body,
          imageUrl: tempVoucher.imageUrl || undefined,
        });
      }

      const savedVoucher: Voucher = res.data.data;
      setVoucher(savedVoucher);
      setTempVoucher(savedVoucher);
      setEditing(false);

      setShowSaveDialog(true);
      router.setParams({ id: savedVoucher.id.toString() });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorDialogHeading(
          err.message ?? `Save failed (HTTP ${err.status})`
        );

        const message =
          Array.isArray(err.data) && err.data.length > 0
            ? err.data.map((item: any) => item.msg).join(". ")
            : err.data || "Unknown API error";

        setErrorDialogMessage(message);
        setErrorDialogOpen(true);
      } else if (err instanceof Error) {
        setErrorDialogHeading("Save failed");
        setErrorDialogMessage(err.message);
        setErrorDialogOpen(true);
      } else {
        setErrorDialogHeading("Save failed");
        setErrorDialogMessage("Unknown error occurred");
        setErrorDialogOpen(true);
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`tasks/${id}`);
      router.push("/(public)/vouchers");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorDialogHeading(
          err.message ?? `Delete failed (HTTP ${err.status})`
        );

        const message =
          Array.isArray(err.data) && err.data.length > 0
            ? err.data.map((item: any) => item.msg).join(". ")
            : err.data || "Unknown API error";

        setErrorDialogMessage(message);
        setErrorDialogOpen(true);
      } else if (err instanceof Error) {
        setErrorDialogHeading("Delete failed");
        setErrorDialogMessage(err.message);
        setErrorDialogOpen(true);
      } else {
        setErrorDialogHeading("Delete failed");
        setErrorDialogMessage("Unknown error occurred");
        setErrorDialogOpen(true);
      }
    }
  };

  const handleDiscard = () => {
    handleDiscardClose();

    if (isNew) {
      router.back();
    } else {
      setEditing(false);
      setTempVoucher(voucher);
    }
  };

  const handleSaveClose = () => setShowSaveDialog(false);
  const handleDeleteClose = () => setShowDeleteDialog(false);
  const handleDiscardClose = () => setShowDiscardDialog(false);

  if (loading) return <Spinner text="Loading voucher..." />;

  if (!voucher) return <Spinner text="Loading voucher..." />;

  return (
    <ScrollView className="flex-1 bg-indigoscale-100">
      <HStack className="w-full gap-5 p-5 items-start">
        {/* Show warning banner if using dummy data */}
        {loadError && (
          <VStack className="w-full p-4 mb-3 bg-yellow-100 border border-yellow-400 rounded-lg">
            <Text className="text-yellow-800 font-semibold">
              ⚠️ Unable to load voucher data
            </Text>
            <Text className="text-yellow-700 text-sm">
              Showing sample data. Please check your connection and try again.
            </Text>
          </VStack>
        )}

        {/* image */}
        <Center className="w-1/2 min-h-64 p-5 bg-white rounded-lg">
          <Text className="text-gray-400 text-center">
            Image upload for vouchers coming soon
          </Text>
        </Center>

        {/* details and actions */}
        {editing ? (
          <VStack className="flex-1 p-5 bg-white rounded-lg" space="md">
            <Text>Name</Text>
            <Input>
              <InputField
                type="text"
                placeholder="Name"
                value={tempVoucher?.taskName || ""}
                onChangeText={(text) =>
                  setTempVoucher((p) => ({ ...p!, taskName: text }))
                }
              />
            </Input>

            <Text>Category</Text>
            <select.Select
              selectedValue={tempVoucher?.taskCategoryId.toString()}
              onValueChange={(value) => {
                const selectedCategory = taskCategories.find(
                  (c) => c.id.toString() === value
                );
                if (selectedCategory) {
                  setTempVoucher((p) => ({
                    ...p!,
                    taskCategoryId: selectedCategory.id,
                    taskCategory: selectedCategory,
                  }));
                }
              }}
            >
              <select.SelectTrigger>
                <select.SelectInput className="flex-1" placeholder="Category" />
                <select.SelectIcon
                  className="mr-3"
                  as={lucideReactNative.ChevronDown}
                />
                <select.SelectPortal>
                  <select.SelectBackdrop />
                  <select.SelectContent>
                    <select.SelectDragIndicatorWrapper>
                      <select.SelectDragIndicator />
                    </select.SelectDragIndicatorWrapper>
                    {taskCategories.map((taskCategory) => (
                      <select.SelectItem
                        key={taskCategory.id}
                        value={taskCategory.id.toString()}
                        label={taskCategory.taskCategoryName}
                        onPress={() =>
                          setTempVoucher((p) => ({
                            ...p!,
                            taskCategoryId: taskCategory.id,
                            taskCategory: taskCategory,
                          }))
                        }
                      />
                    ))}
                  </select.SelectContent>
                </select.SelectPortal>
              </select.SelectTrigger>
            </select.Select>

            <Text>Points</Text>
            <Input>
              <InputField
                type="text"
                keyboardType="numeric"
                inputMode="numeric"
                placeholder="Points"
                value={tempVoucher?.points.toString() || "0"}
                onChangeText={(text) =>
                  setTempVoucher((p) => ({ ...p!, points: parseInt(text) || 0 }))
                }
              />
            </Input>

            <Text>Description</Text>
            <Input>
              <InputField
                type="text"
                placeholder="Description"
                value={tempVoucher?.taskDescription || ""}
                onChangeText={(text) =>
                  setTempVoucher((p) => ({ ...p!, taskDescription: text }))
                }
              />
            </Input>
            <HStack space="md">
              <Button
                action="negative"
                size="sm"
                onPress={() => setShowDiscardDialog(true)}
              >
                {isNew ? (
                  <>
                    <ButtonIcon as={lucideReactNative.ChevronLeft} />
                    <ButtonText>Back</ButtonText>
                  </>
                ) : (
                  <>
                    <ButtonIcon as={lucideReactNative.Trash} />
                    <ButtonText>Discard</ButtonText>
                  </>
                )}
              </Button>
              <Button action="positive" size="sm" onPress={handleSave}>
                <ButtonIcon as={lucideReactNative.Save} />
                <ButtonText>Save</ButtonText>
              </Button>
            </HStack>

            {/* discard alert dialogue */}
            <DiscardDialogue
              isOpen={showDiscardDialog}
              onClose={handleDiscardClose}
              onDiscard={handleDiscard}
              heading="Are you sure you want to discard your changes?"
              message="Your changes cannot be restored once discarded."
            />
          </VStack>
        ) : (
          <VStack className="flex-1 p-5 bg-white rounded-lg" space="md">
            <Heading className="text-2xl text-indigoscale-700">
              {voucher.taskName}
            </Heading>

            <HStack space="lg">
              <Badge size="lg">
                <BadgeText>{voucher.taskCategory.taskCategoryName}</BadgeText>
              </Badge>
              <Badge size="lg">
                <BadgeText>Daily</BadgeText>
              </Badge>
            </HStack>

            <HStack>
              <Heading className="text-3xl text-indigoscale-700">
                {voucher.points}
              </Heading>
              <Text className="text-indigoscale-700" bold>
                pts
              </Text>
            </HStack>
            <Text className="text-gray-500">{voucher.taskDescription}</Text>

            <HStack space="md">
              <Button
                className="bg-indigoscale-700 border border-indigoscale-900"
                size="sm"
                onPress={() => router.back()}
              >
                <ButtonIcon as={lucideReactNative.ChevronLeft} />
                <ButtonText>Back</ButtonText>
              </Button>
              {isAuthenticated && isAdmin && (
                <>
                  <Button
                    action="positive"
                    size="sm"
                    onPress={() => setEditing(true)}
                  >
                    <ButtonIcon as={lucideReactNative.Edit} />
                    <ButtonText>Edit</ButtonText>
                  </Button>

                  <Button
                    action="negative"
                    size="sm"
                    onPress={() => setShowDeleteDialog(true)}
                  >
                    <ButtonIcon as={lucideReactNative.Trash} />
                    <ButtonText>Delete</ButtonText>
                  </Button>
                </>
              )}
            </HStack>

            {/* save alert dialogue */}
            <alert.AlertDialog
              isOpen={showSaveDialog}
              onClose={handleSaveClose}
              size="sm"
            >
              <alert.AlertDialogBackdrop />
              <alert.AlertDialogContent>
                <alert.AlertDialogHeader>
                  <Heading
                    className="text-typography-950 font-semibold"
                    size="md"
                  >
                    Success!
                  </Heading>
                </alert.AlertDialogHeader>

                <alert.AlertDialogBody className="mt-3 mb-4">
                  <Text size="sm">
                    Voucher has been saved successfully. What would you like to do
                    next?
                  </Text>
                </alert.AlertDialogBody>

                <alert.AlertDialogFooter>
                  <Button
                    variant="outline"
                    action="secondary"
                    size="sm"
                    onPress={() => setShowSaveDialog(false)}
                  >
                    <ButtonText>Stay here</ButtonText>
                  </Button>

                  <Button
                    action="primary"
                    size="sm"
                    onPress={() => {
                      setShowSaveDialog(false);
                      router.push("/(public)/vouchers");
                    }}
                  >
                    <ButtonText>Go to Vouchers</ButtonText>
                  </Button>
                </alert.AlertDialogFooter>
              </alert.AlertDialogContent>
            </alert.AlertDialog>

            {/* delete alert dialogue */}
            <alert.AlertDialog
              isOpen={showDeleteDialog}
              onClose={handleDeleteClose}
              size="sm"
            >
              <alert.AlertDialogBackdrop />
              <alert.AlertDialogContent>
                <alert.AlertDialogHeader>
                  <Heading
                    className="text-typography-950 font-semibold"
                    size="md"
                  >
                    Are you sure you want to delete this voucher?
                  </Heading>
                </alert.AlertDialogHeader>
                <alert.AlertDialogBody className="mt-3 mb-4">
                  <Text size="sm">
                    Deleting the voucher will remove it permanently and cannot be
                    undone. Please confirm if you want to proceed.
                  </Text>
                </alert.AlertDialogBody>
                <alert.AlertDialogFooter>
                  <Button
                    variant="outline"
                    action="secondary"
                    onPress={handleDeleteClose}
                    size="sm"
                  >
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button action="negative" size="sm" onPress={handleDelete}>
                    <ButtonText>Delete</ButtonText>
                  </Button>
                </alert.AlertDialogFooter>
              </alert.AlertDialogContent>
            </alert.AlertDialog>
          </VStack>
        )}

        {/*  error alert dialogue */}
        <ErrorDialogue
          isOpen={errorDialogOpen}
          onClose={() => setErrorDialogOpen(false)}
          errorHeading={errorDialogHeading}
          errorMessage={errorDialogMessage}
        />
      </HStack>
    </ScrollView>
  );
};

export default VoucherDetailPage;