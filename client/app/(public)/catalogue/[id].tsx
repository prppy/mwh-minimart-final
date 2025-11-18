import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as lucideReactNative from "lucide-react-native";

import api, { ApiError } from "@/utils/api";
import { pickImage } from "@/utils/hooks";
import { Category, Product } from "@/utils/types";
import { useAuth } from "@/contexts/auth-context";

import DiscardDialogue from "@/components/dialogue/custom-discard-dialogue";
import ErrorDialogue from "@/components/dialogue/custom-error-dialogue";
import Spinner from "@/components/custom-spinner";

import * as alert from "@/components/ui/alert-dialog";
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

const ProductDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [tempProduct, setTempProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // error handling
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogHeading, setErrorDialogHeading] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  const isNew = id === "0";

  useEffect(() => {
    const fetchProduct = async () => {
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
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get("categories");
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchProduct();
    fetchCategories();
  }, [id, isNew]);

  const handleSave = async () => {
    try {
      if (!tempProduct) return;

      let res;

      if (isNew) {
        res = await api.post("products", {
          ...tempProduct,
          imageUrl: tempProduct.imageUrl || undefined,
        });
      } else {
        const { id: _ignored, category: _ignored2, ...body } = tempProduct;

        res = await api.put(`products/${id}`, {
          ...body,
          imageUrl: tempProduct.imageUrl || undefined,
        });
      }

      const savedProduct: Product = res.data.data;

      setProduct(savedProduct);
      setTempProduct(savedProduct);
      setEditing(false);

      setShowSaveDialog(true);
      router.setParams({ id: savedProduct.id.toString() });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorDialogHeading(
          err.message ?? `Save failed (HTTP ${err.status})`
        );

        const message =
          Array.isArray(err.data) && err.data.length > 0
            ? err.data.map((item: any) => item.msg).join(". ")
            : err.message || "Unknown API error";

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
      await api.delete(`products/${id}`);
      router.push("/(public)/catalogue");
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleDiscard = () => {
    handleDiscardClose();

    if (isNew) {
      router.back();
    } else {
      setEditing(false);
    }
  };

  const handleSaveClose = () => setShowSaveDialog(false);
  const handleDeleteClose = () => setShowDeleteDialog(false);
  const handleDiscardClose = () => setShowDiscardDialog(false);

  if (!product) return <Spinner text="Loading product" />;

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
            {product.productName}
          </Heading>

          <HStack space="lg">
            {product.available ? (
              <Badge size="lg" className="bg-greenscale-300">
                <BadgeText>Available</BadgeText>
              </Badge>
            ) : (
              <Badge size="lg" className="bg-redscale-300">
                <BadgeText>Not Available</BadgeText>
              </Badge>
            )}
            <Badge size="lg">
              <BadgeText>{product.category.categoryName}</BadgeText>
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
                  onPress={() => setShowDeleteDialog(true)}
                >
                  <ButtonIcon as={lucideReactNative.Trash} />
                  <ButtonText>Delete</ButtonText>
                </Button>

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
                        Product has been saved successfully. What would you like
                        to do next?
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
                          router.push("/(public)/catalogue");
                        }}
                      >
                        <ButtonText>Go to Catalogue</ButtonText>
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
                        Are you sure you want to delete this product?
                      </Heading>
                    </alert.AlertDialogHeader>
                    <alert.AlertDialogBody className="mt-3 mb-4">
                      <Text size="sm">
                        Deleting the product will remove it permanently and
                        cannot be undone. Please confirm if you want to proceed.
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

      {/*  error alert dialogue */}
      <ErrorDialogue
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        errorHeading={errorDialogHeading}
        errorMessage={errorDialogMessage}
      />
    </HStack>
  );
};

export default ProductDetailPage;
