import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as lucideReactNative from "lucide-react-native";

import api from "@/utils/api";
import { pickImage } from "@/utils/hooks";
import { Category, Product } from "@/utils/types";
import { useAuth } from "@/contexts/auth-context";

import Spinner from "@/components/custom-spinner";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Input, InputField } from "@/components/ui/input";
import * as select from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import * as alert from "@/components/ui/alert-dialog";

const ProductDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [tempProduct, setTempProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const isNew = id === "0";

  useEffect(() => {
    if (!isNew) {
      api.get(`products/${id}`).then((res) => {
        const data = res.data.data;
        setProduct(data);
        setTempProduct({ ...data });
      });
    } else {
      const emptyProduct: Product = {
        id: 0,
        productName: "",
        productDescription: "",
        categoryId: 0,
        category: { id: 0, categoryName: "" },
        imageUrl: "",
        available: true,
        points: 0,
      };
      setProduct(emptyProduct);
      setTempProduct({ ...emptyProduct });
      setEditing(true);
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get("categories");
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
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
      if (!tempProduct) return;

      if (isNew) {
        await api.post("products", tempProduct);
      } else {
        await api.put(`products/${id}`, tempProduct);
      }

      setProduct(tempProduct);
      setEditing(false);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`products/${id}`);
      router.back();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleClose = () => setShowAlertDialog(false);

  if (!product) return <Spinner />;

  return (
    <HStack className="w-full h-full gap-5 p-5 bg-indigoscale-100 items-start">
      {/* image */}
      <Center className="w-1/2 min-h-64 p-5 bg-white rounded-lg">
        {editing ? (
          <>
            {tempProduct?.imageUrl ? (
              <Image
                source={tempProduct.imageUrl}
                alt={tempProduct.productName}
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
                  setTempProduct((p) => ({ ...p!, imageUrl: uri }))
                )
              }
            >
              <ButtonText>
                {tempProduct?.imageUrl ? "Change Image" : "Upload Image"}
              </ButtonText>
            </Button>
          </>
        ) : (
          <Image
            source={product.imageUrl}
            alt={product.productName}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        )}
      </Center>

      {/* details and actions */}
      {editing ? (
        <VStack className="flex-1 p-5 bg-white rounded-lg" space="md">
          <Text>Name</Text>
          <Input>
            <InputField
              type="text"
              placeholder="Name"
              value={tempProduct?.productName || ""}
              onChangeText={(text) =>
                setTempProduct((p) => ({ ...p!, productName: text }))
              }
            />
          </Input>

          <Text>Category</Text>
          <select.Select
            selectedValue={tempProduct?.category.categoryName.toString()}
            onValueChange={(value) => {
              const selectedCategory = categories.find(
                (c) => c.id.toString() === value
              );
              if (selectedCategory) {
                setTempProduct((p) => ({
                  ...p!,
                  categoryId: selectedCategory.id,
                  category: selectedCategory,
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
                  {categories.map((category) => (
                    <select.SelectItem
                      key={category.id}
                      value={category.id.toString()}
                      label={category.categoryName}
                      onPress={() =>
                        setTempProduct((p) => ({
                          ...p!,
                          categoryId: category.id,
                          category: category,
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
              value={tempProduct?.points.toString() || "0"}
              onChangeText={(text) =>
                setTempProduct((p) => ({ ...p!, points: parseInt(text) || 0 }))
              }
            />
          </Input>

          <Text>Description</Text>
          <Input>
            <InputField
              type="text"
              placeholder="Description"
              value={tempProduct?.productDescription || ""}
              onChangeText={(text) =>
                setTempProduct((p) => ({ ...p!, productDescription: text }))
              }
            />
          </Input>

          <HStack space="md">
            <Button
              action="negative"
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
            {true && (
              <Button
                action="positive"
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
            {product.productName}
          </Heading>

          <HStack space="lg">
            <Badge size="lg">
              <BadgeText>{product.category.categoryName}</BadgeText>
            </Badge>
            <Badge size="lg">
              <BadgeText>Daily</BadgeText>
            </Badge>
          </HStack>

          <HStack>
            <Heading className="text-3xl text-indigoscale-700">
              {product.points}
            </Heading>
            <Text className="text-indigoscale-700" bold>
              pts
            </Text>
          </HStack>
          <Text className="text-gray-500">{product.productDescription}</Text>

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
                  onPress={() => setShowAlertDialog(true)}
                >
                  <ButtonIcon as={lucideReactNative.Trash} />
                  <ButtonText>Delete</ButtonText>
                </Button>

                {/* deletion alert dialogue */}
                <alert.AlertDialog
                  isOpen={showAlertDialog}
                  onClose={handleClose}
                  size="sm"
                >
                  <alert.AlertDialogBackdrop />
                  <alert.AlertDialogContent>
                    <alert.AlertDialogHeader>
                      <Heading
                        className="text-typography-950 font-semibold"
                        size="md"
                      >
                        Are you sure you want to delete this product?
                      </Heading>
                    </alert.AlertDialogHeader>
                    <alert.AlertDialogBody className="mt-3 mb-4">
                      <Text size="sm">
                        Deleting the product will remove it permanently and
                        cannot be undone. Please confirm if you want to proceed.
                      </Text>
                    </alert.AlertDialogBody>
                    <alert.AlertDialogFooter className="">
                      <Button
                        variant="outline"
                        action="secondary"
                        onPress={handleClose}
                        size="sm"
                      >
                        <ButtonText>Cancel</ButtonText>
                      </Button>
                      <Button
                        action="negative"
                        size="sm"
                        onPress={handleDelete}
                      >
                        <ButtonText>Delete</ButtonText>
                      </Button>
                    </alert.AlertDialogFooter>
                  </alert.AlertDialogContent>
                </alert.AlertDialog>
              </>
            )}
          </HStack>
        </VStack>
      )}
    </HStack>
  );
};

export default ProductDetailPage;
