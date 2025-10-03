import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Button,
  ButtonText,
  Badge,
  BadgeText,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  CheckIcon,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectContent,
  SelectItem,
  SelectIcon,
  ChevronDownIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import SearchBar from '@/components/Searchbar';
import CustomCard from '@/components/CustomCard';
import api from '@/components/utility/api';

type Product = {
  id: number;
  productName: string;
  productDescription?: string | null;
  points: number;
  imageUrl?: string | null;
  category?: { id: number; categoryName: string } | null;
};

type SortOrder = 'points-asc' | 'points-desc';

const CataloguePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subCategorySelections, setSubCategorySelections] = useState<Record<string, boolean>>({});
  const [type, setType] = useState<'Showcase' | 'Daily'>('Showcase');
  const [maxPoints, setMaxPoints] = useState<number>(1000); // upper bound of slider
  const [currentPointFilter, setCurrentPointFilter] = useState<number>(1000); // currently applied filter value
  const [sort, setSort] = useState<SortOrder>('points-asc');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ success: boolean; data: Product[] }>("/products", { cache: true });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setProducts(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const allCategories = useMemo(() => {
    const names = new Set<string>();
    products.forEach(p => {
      const name = p.category?.categoryName;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [products]);

  // Decide which categories are visible based on type
  const isCategoryAllowedForType = (name?: string | null) => {
    const n = (name || '').toLowerCase();
    if (!n) return false;
    if (type === 'Showcase') {
      // Electronics only (support plural/variants)
      return n.includes('electronic');
    }
    // Daily: drinks, food and personal care (support common synonyms)
    return (
      n.includes('drink') ||
      n.includes('food') ||
      n.includes('snack') ||
      n.includes('personal care') ||
      n.includes('hygiene') ||
      n.includes('toiletr')
    );
  };

  const visibleCategories = useMemo(
    () => allCategories.filter((c) => isCategoryAllowedForType(c)),
    [allCategories, type]
  );

  // Clear selection if it becomes invalid when switching type
  useEffect(() => {
    if (selectedCategory && !isCategoryAllowedForType(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [type]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        (p.productDescription || '').toLowerCase().includes(q)
      );
    }

    // Always restrict products by the allowed categories for the selected type
    list = list.filter(p => isCategoryAllowedForType(p.category?.categoryName));

    if (selectedCategory) {
      list = list.filter(p => (p.category?.categoryName || '') === selectedCategory);
    }

    list = list.filter(p => p.points <= currentPointFilter);

    list.sort((a, b) => (sort === 'points-asc' ? a.points - b.points : b.points - a.points));

    return list;
  }, [products, searchText, selectedCategory, currentPointFilter, sort, type]);

  const selectCategory = (name: string) => {
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: `/catalogue/${product.id}`,
      params: {
        Product_ID: product.id.toString(),
        Product_Name: product.productName,
        Product_Description: product.productDescription || '',
        Points: product.points.toString(),
        Category: product.category?.categoryName || 'Unknown',
      },
    });
  };

  return (
    <ScrollView flex={1} backgroundColor="$backgroundLight0">
      <Box p="$6" flex={1}>
        {/* Top controls */}
        <HStack alignItems="center" justifyContent="space-between" mb="$6">
          <Box flex={1} maxWidth={560}>
            <SearchBar value={searchText} onChangeText={setSearchText} placeholder="Search" />
          </Box>
          <HStack space="md" ml="$6">
            <Button
              variant={sort === 'points-asc' ? 'solid' : 'outline'}
              size="sm"
              onPress={() => setSort('points-asc')}
            >
              <ButtonText>Point ascending</ButtonText>
            </Button>
            <Button
              variant={sort === 'points-desc' ? 'solid' : 'outline'}
              size="sm"
              onPress={() => setSort('points-desc')}
            >
              <ButtonText>Points descending</ButtonText>
            </Button>
          </HStack>
        </HStack>

        {/* Content */}
        <HStack alignItems="flex-start" space="lg">
          {/* Sidebar filters */}
          <Box width={260} backgroundColor="$white" borderRadius="$xl" p="$4" shadowColor="$backgroundLight800" shadowOffset={{ width: 0, height: 1 }}>
            <VStack space="lg">

            <VStack>
                <Text fontWeight="$semibold" mb="$2">Type</Text>
                <HStack space="md">
                  <Button
                    variant={type === 'Showcase' ? 'solid' : 'outline'}
                    size="sm"
                    onPress={() => setType('Showcase')}
                  >
                    <ButtonText>Showcase</ButtonText>
                  </Button>
                  <Button
                    variant={type === 'Daily' ? 'solid' : 'outline'}
                    size="sm"
                    onPress={() => setType('Daily')}
                  >
                    <ButtonText>Daily</ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <VStack>
                <Text fontWeight="$semibold" mb="$2">Category</Text>
                {/* Selected category chip */}
                <HStack flexWrap="wrap" mb="$2" space="sm">
                  {selectedCategory && (
                    <Badge variant="solid" backgroundColor="$backgroundLight200">
                      <HStack alignItems="center" space="xs">
                        <BadgeText color="$textLight800">{selectedCategory}</BadgeText>
                        <Pressable onPress={() => setSelectedCategory(null)}>
                          <BadgeText color="$textLight600">×</BadgeText>
                        </Pressable>
                      </HStack>
                    </Badge>
                  )}
                </HStack>

                {/* Category checkboxes (restricted by type) */}
                <VStack space="sm">
                  {visibleCategories.map(name => (
                    <Checkbox
                      key={name}
                      value={name}
                      isChecked={selectedCategory === name}
                      onChange={() => selectCategory(name)}
                    >
                      <CheckboxIndicator mr="$2">
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel>{name}</CheckboxLabel>
                    </Checkbox>
                  ))}
                </VStack>
              </VStack>

              <VStack>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="$semibold">Points</Text>
                  <Text color="$textLight500">{currentPointFilter}pts</Text>
                </HStack>
                <Slider value={currentPointFilter} minValue={0} maxValue={1000} onChange={setCurrentPointFilter} marginTop={'$4'}>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </VStack>
            </VStack>
          </Box>

          {/* Product grid */}
          <Box flex={1}>
            {error ? (
              <Text color="$error600">{error}</Text>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 20 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => handleProductPress(item)} style={{ width: '48%' }}>
                    <CustomCard
                      image={item.imageUrl ? { uri: item.imageUrl } : undefined}
                      title={item.productName}
                      points={item.points}
                    />
                  </Pressable>
                )}
                ListEmptyComponent={
                  loading ? (
                    <Text color="$textLight600">Loading...</Text>
                  ) : (
                    <Text color="$textLight600">No products found</Text>
                  )
                }
              />
            )}
          </Box>
        </HStack>
      </Box>
    </ScrollView>
  );
};

export default CataloguePage;