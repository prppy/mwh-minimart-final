import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import api from "@/utils/api";
import { Category, Product } from "@/utils/types";

import Checkbox from "@/components/custom-checkbox";
import SearchableGrid from "@/components/custom-searchable-grid";
import Spinner from "@/components/custom-spinner";

import { CheckboxGroup } from "@/components/ui/checkbox";
import { HStack } from "@/components/ui/hstack";
import * as slider from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const CataloguePage: React.FC = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [points, setPoints] = useState(4000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("categories");
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        let queryString = "products";

        // TODO: implement multiple category filtering in backend
        if (selectedCategories.length > 0) {
          queryString += `/category/${selectedCategories[0]}`;
        }

        const response = await api.get(queryString);
        let fetchedProducts: Product[] = [];

        if (Array.isArray(response.data.data)) {
          fetchedProducts = response.data.data;
        } else if (Array.isArray(response.data.data.products)) {
          fetchedProducts = response.data.data.products;
        } else {
          console.warn("Unexpected response:", response.data);
        }

        // TODO: implement points range filtering in backend
        fetchedProducts = fetchedProducts.filter(
          (product) => product.points <= points,
        );

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProducts();
  }, [points, selectedCategories]);

  return (
    <HStack className="flex-1 gap-5 p-5 pb-5 bg-indigoscale-100 items-stretch">
      <VStack
        className="w-1/4 self-start p-5 bg-white border border-gray-300 rounded-lg"
        space="xl"
      >
        {/* category filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700" size={"lg"}>
            Category
          </Text>
          <VStack space="sm">
            <CheckboxGroup
              value={selectedCategories}
              onChange={setSelectedCategories}
            >
              {categories.map((category) => (
                <Checkbox key={category.id} value={category.id.toString()}>
                  {category.categoryName}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </VStack>
        </VStack>

        {/* type filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700" size={"lg"}>
            Type
          </Text>
          <VStack space="sm">
            <Checkbox value="Daily">Daily</Checkbox>
            <Checkbox value="Showcase">Showcase</Checkbox>
          </VStack>
        </VStack>

        {/* points filter */}
        <VStack space="xs">
          <Text className="text-indigoscale-700" size={"lg"}>
            Points (0 - {points})
          </Text>
          <slider.Slider
            minValue={0}
            maxValue={4000}
            step={50}
            defaultValue={4000}
            onChange={setPoints}
          >
            <slider.SliderTrack>
              <slider.SliderFilledTrack
                className="
                bg-indigoscale-500 rounded-full
                data-[active=true]:bg-indigoscale-500
                data-[hover=true]:bg-indigoscale-500
              "
              />
            </slider.SliderTrack>
            <slider.SliderThumb
              className="
                w-5 h-5 rounded-full shadow
                bg-indigoscale-700
                data-[active=true]:bg-indigoscale-700
                data-[hover=true]:bg-indigoscale-700
              "
            />
          </slider.Slider>
        </VStack>
      </VStack>
      {/* products grid */}
      {loading ? (
        <Spinner text="Loading products..." />
      ) : (
        <SearchableGrid
          items={products.map((product) => ({
            id: product.id,
            name: product.productName,
            points: product.points,
            image: product.imageUrl,
          }))}
          onItemPress={(item) => router.push(`/catalogue/${item.id}`)}
          onAddPress={() => router.push(`/catalogue/0`)}
          noItemsAlert="No products found!"
        />
      )}
    </HStack>
  );
};

export default CataloguePage;
