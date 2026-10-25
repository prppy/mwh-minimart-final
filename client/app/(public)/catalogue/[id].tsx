import { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";

const MOBILE_BREAKPOINT = 768;
import { useLocalSearchParams, useRouter } from "expo-router";
import * as lucideReactNative from "lucide-react-native";

import api, { ApiError } from "@/utils/api";
import { pickImage } from "@/utils/hooks";
import { Category, Product } from "@/utils/types";
import { useAuth } from "@/contexts/auth-context";

import Checkbox from "@/components/custom-checkbox";
import DiscardDialogue from "@/components/dialogue/custom-discard-dialogue";
import ErrorDialogue from "@/components/dialogue/custom-error-dialogue";
import Spinner from "@/components/custom-spinner";

import * as alert from "@/components/ui/alert-dialog";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Input, InputField } from "@/components/ui/input";
import * as select from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// MWH_Type rows (Daily = 1, Showcase = 2)
const PRODUCT_TYPES = [
  { id: 1, name: "Daily" },
  { id: 2, name: "Showcase" },
];

// One size (tier) in the edit form. `id` is the product row, unset for a new size.
interface SizeRow {
  key: string;
  id?: number;
  label: string;
  points: string;
  outOfStock: boolean;
}

const sizeRowsFrom = (products: Product[]): SizeRow[] =>
  products.map((p) => ({
    key: String(p.id),
    id: p.id,
    label: p.tierLabel || "",
    points: String(p.points),
    outOfStock: !!p.isPreorder,
  }));

let newRowCount = 0;
const newRowKey = () => `new-${++newRowCount}`;

const ProductDetailPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const [product, setProduct] = useState<Product | null>(null);
  const [tempProduct, setTempProduct] = useState<Product | null>(null);
  // Every size of this product (e.g. Small / Medium / Large); empty when it has no sizes
  const [groupProducts, setGroupProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [saving, setSaving] = useState(false);
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

  /** The edit form names a sized product by its group ("Chocolates"), not "Chocolates – Small" */
  const editableCopy = (data: Product): Product => ({
    ...data,
    productName: data.productGroup || data.productName,
  });

  const loadProduct = async (productId: string | number) => {
    const res = await api.get(`products/${productId}`);
    const data: Product = res.data.data;

    let siblings: Product[] = [];
    if (data.productGroup) {
      const all = await api.get("products");
      const list: Product[] = Array.isArray(all.data.data)
        ? all.data.data
        : all.data.data?.products || [];
      siblings = list
        .filter(
          (p) =>
            p.productGroup === data.productGroup &&
            p.categoryId === data.categoryId &&
            // Deleted sizes that were already redeemed stay as unavailable rows
            (p.available !== false || p.id === data.id),
        )
        .sort((a, b) => a.points - b.points);
    }

    setProduct(data);
    setTempProduct(editableCopy(data));
    setGroupProducts(siblings);
    setSizes(sizeRowsFrom(siblings));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isNew) {
        loadProduct(id).catch((err) => console.error("Error fetching product:", err));
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
          typeId: 1,
          productGroup: null,
          tierLabel: null,
          maxPerOrder: null,
          isPreorder: false,
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

  const showError = (heading: string, message: string) => {
    setErrorDialogHeading(heading);
    setErrorDialogMessage(message);
    setErrorDialogOpen(true);
  };

  const startEditing = () => {
    if (!product) return;
    setTempProduct(editableCopy(product));
    setSizes(sizeRowsFrom(groupProducts));
    setEditing(true);
  };

  const updateSize = (key: string, changes: Partial<SizeRow>) =>
    setSizes((rows) => rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  // Turn a single-price product into one with sizes: its price becomes the first size
  const addSizes = () =>
    setSizes([
      {
        key: newRowKey(),
        id: isNew ? undefined : product?.id,
        label: "",
        points: String(tempProduct?.points ?? 0),
        outOfStock: !!tempProduct?.isPreorder,
      },
      { key: newRowKey(), label: "", points: "", outOfStock: false },
    ]);

  const handleSave = async () => {
    if (!tempProduct || !product || saving) return;

    const name = tempProduct.productName.trim();
    const rows = sizes.map((row) => ({ ...row, label: row.label.trim() }));
    if (!name) return showError("Missing name", "Please enter a name.");
    if (rows.length > 1) {
      if (rows.some((row) => !row.label)) {
        return showError("Missing size name", "Give every size a name, e.g. Small.");
      }
      if (new Set(rows.map((row) => row.label.toLowerCase())).size !== rows.length) {
        return showError("Duplicate size", "Each size needs a different name.");
      }
    }
    if (rows.some((row) => row.points === "")) {
      return showError("Missing points", "Enter the points for every size.");
    }

    const { id: _id, category: _category, ...rest } = tempProduct;
    const shared = {
      productDescription: rest.productDescription,
      categoryId: rest.categoryId,
      typeId: rest.typeId,
      maxPerOrder: rest.maxPerOrder,
      imageUrl: rest.imageUrl || undefined,
    };

    // One product row per size, or a single row (sizes removed or never added)
    const saves =
      rows.length > 1
        ? rows.map((row) => ({
            id: row.id,
            body: {
              ...shared,
              productName: `${name} – ${row.label}`,
              productGroup: name,
              tierLabel: row.label,
              points: Number(row.points),
              isPreorder: row.outOfStock,
            },
          }))
        : [
            {
              id: rows.length === 1 ? rows[0].id : isNew ? undefined : product.id,
              body: {
                ...shared,
                productName: name,
                productGroup: null,
                tierLabel: null,
                points: rows.length === 1 ? Number(rows[0].points) : tempProduct.points,
                isPreorder: rows.length === 1 ? rows[0].outOfStock : !!tempProduct.isPreorder,
              },
            },
          ];
    const keptIds = new Set(saves.map((s) => s.id));
    const removed = groupProducts.filter((p) => !keptIds.has(p.id));

    setSaving(true);
    try {
      const saved: Product[] = [];
      for (const { id: rowId, body } of saves) {
        const res = rowId
          ? await api.put(`products/${rowId}`, body)
          : await api.post("products", body);
        saved.push(res.data.data);
      }
      for (const p of removed) {
        await api.delete(`products/${p.id}`);
      }

      // Show the cheapest size, like the catalogue card does
      const first = [...saved].sort((a, b) => a.points - b.points)[0];
      await loadProduct(first.id);
      setEditing(false);
      setShowSaveDialog(true);
      router.setParams({ id: first.id.toString() });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorDialogHeading(
          err.message ?? `Save failed (HTTP ${err.status})`,
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
    } finally {
      setSaving(false);
    }
  };

  // Deletes the product, or every size of it
  const handleDelete = async () => {
    try {
      setShowDeleteDialog(false);
      const ids = groupProducts.length > 1 ? groupProducts.map((p) => p.id) : [Number(id)];
      for (const productId of ids) {
        await api.delete(`products/${productId}`);
      }
      router.push("/(public)/catalogue");
    } catch (err) {
      console.error("Delete failed", err);
      setErrorDialogHeading("Delete failed");
      setErrorDialogMessage(err instanceof Error ? err.message : "Unknown error occurred");
      setErrorDialogOpen(true);
    }
  };

  const handleDiscard = () => {
    handleDiscardClose();

    if (isNew) {
      router.push("/(public)/catalogue");
    } else {
      setEditing(false);
    }
  };

  const handleSaveClose = () => setShowSaveDialog(false);
  const handleDeleteClose = () => setShowDeleteDialog(false);
  const handleDiscardClose = () => setShowDiscardDialog(false);

  if (!product) return <Spinner text="Loading product..." />;

  const hasSizes = groupProducts.length > 1;

  const content = (
    <View style={{ flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 20, padding: isMobile ? 12 : 20, width: "100%", flex: isMobile ? undefined : 1 }} className="bg-[#f2f4f9] items-start">
      {/* image */}
      <Center className={`${isMobile ? "w-full" : "w-1/2"} min-h-64 p-5 bg-white border border-[#e1e5ef] rounded-2xl`}>
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
                  setTempProduct((p) => ({ ...p!, imageUrl: uri })),
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
            className={`w-full ${isMobile ? "h-64" : "h-96"} rounded-lg`}
            resizeMode="contain"
          />
        )}
      </Center>
      {/* details and actions */}
      {editing ? (
        <VStack className="flex-1 p-5 bg-white border border-[#e1e5ef] rounded-2xl" space="md">
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
                (c) => c.id.toString() === value,
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

          {sizes.length === 0 ? (
            <>
              <Text>Points</Text>
              <Input>
                <InputField
                  type="text"
                  keyboardType="numeric"
                  inputMode="numeric"
                  placeholder="Points"
                  value={tempProduct?.points !== undefined ? tempProduct.points.toString() : ""}
                  onChangeText={(text) => {
                    const parsed = parseInt(text);
                    setTempProduct((p) => ({
                      ...p!,
                      points: isNaN(parsed) ? 0 : parsed,
                    }));
                  }}
                />
              </Input>
              <Checkbox
                value="isPreorder"
                isChecked={!!tempProduct?.isPreorder}
                onChange={(checked) =>
                  setTempProduct((p) => ({ ...p!, isPreorder: checked }))
                }
              >
                Out of stock (residents can pre-order it)
              </Checkbox>
              <Button
                variant="outline"
                action="secondary"
                size="sm"
                className="self-start"
                onPress={addSizes}
              >
                <ButtonIcon as={lucideReactNative.Plus} />
                <ButtonText>Add sizes (e.g. Small / Medium / Large)</ButtonText>
              </Button>
            </>
          ) : (
            <VStack space="sm">
              <Text>Sizes (shown as one item with a size dropdown)</Text>
              {sizes.map((row) => (
                <HStack key={row.key} space="sm" className="items-center">
                  <Input className="flex-1">
                    <InputField
                      type="text"
                      placeholder="Size, e.g. Small"
                      value={row.label}
                      onChangeText={(text) => updateSize(row.key, { label: text })}
                    />
                  </Input>
                  <Input className="w-24">
                    <InputField
                      type="text"
                      keyboardType="numeric"
                      inputMode="numeric"
                      placeholder="Points"
                      value={row.points}
                      onChangeText={(text) =>
                        updateSize(row.key, { points: text.replace(/[^0-9]/g, "") })
                      }
                    />
                  </Input>
                  <Checkbox
                    value={`stock-${row.key}`}
                    isChecked={row.outOfStock}
                    onChange={(checked) => updateSize(row.key, { outOfStock: checked })}
                  >
                    Out of stock
                  </Checkbox>
                  <Button
                    variant="link"
                    action="negative"
                    size="sm"
                    accessibilityLabel={`Remove size ${row.label}`}
                    onPress={() => setSizes((rows) => rows.filter((r) => r.key !== row.key))}
                  >
                    <ButtonIcon as={lucideReactNative.X} />
                  </Button>
                </HStack>
              ))}
              <Button
                variant="outline"
                action="secondary"
                size="sm"
                className="self-start"
                onPress={() =>
                  setSizes((rows) => [
                    ...rows,
                    { key: newRowKey(), label: "", points: "", outOfStock: false },
                  ])
                }
              >
                <ButtonIcon as={lucideReactNative.Plus} />
                <ButtonText>Add size</ButtonText>
              </Button>
              <Text size="sm" className="text-gray-500">
                Out-of-stock sizes show a Pre-order button. Removing every size but one
                turns this back into a single item.
              </Text>
            </VStack>
          )}

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

          <Text>Type</Text>
          <HStack space="sm">
            {PRODUCT_TYPES.map((type) => {
              const isSelected = (tempProduct?.typeId ?? 1) === type.id;
              return (
                <Button
                  key={type.id}
                  size="sm"
                  action="secondary"
                  className={isSelected ? "bg-indigoscale-700" : ""}
                  onPress={() =>
                    setTempProduct((p) => ({ ...p!, typeId: type.id }))
                  }
                >
                  <ButtonText
                    className={isSelected ? "text-white" : "text-indigoscale-700"}
                  >
                    {type.name}
                  </ButtonText>
                </Button>
              );
            })}
          </HStack>

          <Text>Max per order (1-10, leave empty for no limit)</Text>
          <Input>
            <InputField
              type="text"
              keyboardType="numeric"
              inputMode="numeric"
              placeholder="No limit"
              value={tempProduct?.maxPerOrder ? tempProduct.maxPerOrder.toString() : ""}
              onChangeText={(text) => {
                const parsed = parseInt(text);
                setTempProduct((p) => ({
                  ...p!,
                  maxPerOrder: isNaN(parsed) ? null : Math.min(Math.max(parsed, 1), 10),
                }));
              }}
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
            <Button action="positive" size="sm" onPress={handleSave} disabled={saving}>
              <ButtonIcon as={lucideReactNative.Save} />
              <ButtonText>{saving ? "Saving..." : "Save"}</ButtonText>
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
        <VStack className="flex-1 p-5 bg-white border border-[#e1e5ef] rounded-2xl" space="md">
          <Heading className="text-2xl text-indigoscale-700">
            {hasSizes ? product.productGroup : product.productName}
          </Heading>

          <HStack space="lg">
            {product.available ? (
              <Badge size="lg" className="bg-greenscale-300">
                <BadgeText className="text-greenscale-700">Available</BadgeText>
              </Badge>
            ) : (
              <Badge size="lg" className="bg-redscale-300">
                <BadgeText className="text-redscale-700">Not Available</BadgeText>
              </Badge>
            )}
            <Badge size="lg">
              <BadgeText>{product.category.categoryName}</BadgeText>
            </Badge>
            {!hasSizes && !!product.isPreorder && (
              <Badge size="lg" className="bg-orangescale-300">
                <BadgeText className="text-orangescale-700">Out of stock</BadgeText>
              </Badge>
            )}
          </HStack>

          {hasSizes ? (
            <VStack space="xs">
              {groupProducts.map((p) => (
                <HStack
                  key={p.id}
                  className="justify-between items-center px-3 py-2 rounded-md bg-indigoscale-100"
                >
                  <Text bold className="text-indigoscale-700">
                    {p.tierLabel || p.productName}
                  </Text>
                  <HStack space="md" className="items-center">
                    {!!p.isPreorder && (
                      <Text size="sm" bold className="text-orangescale-700">
                        Out of stock
                      </Text>
                    )}
                    <Text bold className="text-indigoscale-700">
                      {p.points} pts
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          ) : (
            <HStack>
              <Heading className="text-3xl text-[#e8502a]">
                {product.points}
              </Heading>
              <Text className="text-[#e8502a]" bold>
                pts
              </Text>
            </HStack>
          )}
          <Text className="text-gray-500">{product.productDescription}</Text>
          {product.maxPerOrder ? (
            <Text className="text-gray-500">
              Limit: {product.maxPerOrder} per order
            </Text>
          ) : null}
          {(hasSizes ? groupProducts.some((p) => p.isPreorder) : !!product.isPreorder) && (
            <Text className="text-orangescale-700">
              Out of stock items can be pre-ordered: points are deducted when you
              redeem, and staff will tell you when it is ready to collect.
            </Text>
          )}

          <HStack space="md">
            <Button
              className="bg-indigoscale-700 border border-indigoscale-900"
              size="sm"
              onPress={() => router.push("/(public)/catalogue")}
            >
              <ButtonIcon as={lucideReactNative.ChevronLeft} />
              <ButtonText>Back</ButtonText>
            </Button>
            {isAuthenticated && isAdmin && (
              <>
                <Button
                  action="positive"
                  size="sm"
                  onPress={startEditing}
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
                  <ButtonText>{hasSizes ? "Delete all sizes" : "Delete"}</ButtonText>
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
                        {hasSizes
                          ? `Delete ${product.productGroup} and all ${groupProducts.length} sizes?`
                          : "Are you sure you want to delete this product?"}
                      </Heading>
                    </alert.AlertDialogHeader>
                    <alert.AlertDialogBody className="mt-3 mb-4">
                      <Text size="sm">
                        Deleting the product will remove it permanently and
                        cannot be undone. Please confirm if you want to proceed.
                        {hasSizes ? " To remove only one size, use Edit instead." : ""}
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
    </View>
  );

  return isMobile ? (
    <ScrollView className="flex-1 bg-[#f2f4f9]">
      {content}
    </ScrollView>
  ) : content;
};

export default ProductDetailPage;
