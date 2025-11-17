import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as lucideReactNative from "lucide-react-native";

import api from "@/utils/api";
import { TaskCategory, Voucher } from "@/utils/types";
import { useAuth } from "@/contexts/auth-context";

import Spinner from "@/components/custom-spinner";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import * as select from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const VoucherDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [tempVoucher, setTempVoucher] = useState<Voucher | null>(null);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [editing, setEditing] = useState(false);

  const isNew = id === "0";

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        if (!isNew) {
          const res = await api.get("tasks"); // TODO: configure getting tasks by id (`tasks/${id}`)
          const data: Voucher[] = res.data.data.tasks || [];
          const found = data.find((d) => d.id.toString() === id);

          if (found) {
            setVoucher(found);
            setTempVoucher({ ...found });
          } else {
            // TODO: popup toast
            console.warn(`Voucher with id ${id} not found`);
          }
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
            points: 0,
            _count: { completions: 0 },
          };
          setVoucher(emptyVoucher);
          setTempVoucher({ ...emptyVoucher });
          setEditing(true);
        }
      } catch (error) {
        console.error("Error fetching voucher:", error);
      }
    };

    // TODO: configure getting task categories (`taskCategory`)
    const fetchTaskCategories = async () => {
      try {
        const res = await api.get("tasks");
        const data: Voucher[] = res.data.data.tasks || [];
        const foundTaskCategories = data
          .map((v) => v.taskCategory)
          .filter((c): c is TaskCategory => !!c)
          .filter(
            (cat, index, self) =>
              index === self.findIndex((c) => c.id === cat.id)
          );
        setTaskCategories(foundTaskCategories);
      } catch (error) {
        console.error("Error fetching task categories:", error);
      }
    };

    fetchVoucher();
    fetchTaskCategories();
  }, [id, isNew]);

  const handleDiscard = () => {
    if (isNew) {
      router.back();
    } else {
      setEditing(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!tempVoucher) return;

      if (isNew) {
        await api.post("tasks", tempVoucher);
      } else {
        await api.put(`tasks/${id}`, tempVoucher);
      }

      setVoucher(tempVoucher);
      setEditing(false);
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`tasks/${id}`);
      router.back();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  if (!voucher) return <Spinner />;

  return (
    <HStack className="w-full h-full gap-5 p-5 bg-indigoscale-100 items-start">
      {/* image */}
      <Center className="w-1/2 min-h-64 p-5 bg-white rounded-lg">
        {/* TODO: configure images for vouchers */}
        {/* {editing ? (
          <>
            {tempVoucher?.imageUrl ? (
              <Image
                source={tempVoucher.imageUrl}
                alt={tempVoucher.taskName}
                className="w-full h-64 rounded-lg"
                resizeMode="contain"
              />
            ) : (
              <Text>No image selected</Text>
            )}
            <Button
              className="mt-3 bg-indigoscale-700 border border-indigoscale-900"
              size="sm"
              onPress={() =>
                pickImage((uri) =>
                  setTempVoucher((p) => ({ ...p!, imageUrl: uri }))
                )
              }
            >
              <ButtonText>
                {tempVoucher?.imageUrl ? "Change Image" : "Upload Image"}
              </ButtonText>
            </Button>
          </>
        ) : (
          <Image
            source={voucher.imageUrl}
            alt={voucher.taskName}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        )} */}
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
            selectedValue={tempVoucher?.taskCategory.taskCategoryName.toString()}
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
              className="bg-error-400 border border-error-500"
              size="sm"
              onPress={handleDiscard}
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
            {isAuthenticated && isAdmin && (
              <Button
                className="bg-success-400 border border-success-500"
                size="sm"
                onPress={handleSave}
              >
                <ButtonIcon as={lucideReactNative.Save} />
                <ButtonText>Save</ButtonText>
              </Button>
            )}
          </HStack>
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
                  className="bg-success-400 border border-success-500"
                  size="sm"
                  onPress={() => setEditing(true)}
                >
                  <ButtonIcon as={lucideReactNative.Edit} />
                  <ButtonText>Edit</ButtonText>
                </Button>

                <Button
                  className="bg-error-400 border border-error-500"
                  size="sm"
                  onPress={handleDelete}
                >
                  <ButtonIcon as={lucideReactNative.Trash} />
                  <ButtonText>Delete</ButtonText>
                </Button>
              </>
            )}
          </HStack>
        </VStack>
      )}
    </HStack>
  );
};

export default VoucherDetailPage;
