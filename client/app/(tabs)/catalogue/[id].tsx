import React from 'react';
import { 
  Box, 
  Text, 
  Button, 
  ButtonText, 
  Image, 
  VStack, 
  HStack, 
  ScrollView,
  SafeAreaView,
  Badge,
  BadgeText,
  Pressable
} from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface Product {
  Product_ID: number;
  Product_Name: string;
  Product_Description: string;
  Points: number;
  Category: string;
}

const ProductDetailsPage: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse the product data from params
  const product: Product = {
    Product_ID: Number(params.Product_ID),
    Product_Name: params.Product_Name as string,
    Product_Description: params.Product_Description as string,
    Points: Number(params.Points),
    Category: params.Category as string,
  };

  return (
    <SafeAreaView flex={1} backgroundColor="$white">
      <ScrollView flex={1}>
        <Box flex={1} p="$6">
          {/* Main Content Container */}
          <HStack space="xl" alignItems="flex-start" flex={1}>
            {/* Left Side - Product Image */}
            <Box flex={1} maxWidth="50%">
              <Box
                width="100%"
                height={500}
                borderRadius="$2xl"
                backgroundColor="$backgroundLight100"
                justifyContent="center"
                alignItems="center"
                overflow="hidden"
              >
                <Image
                  // random milo for demonstration purposes
                  source={{
                    uri: 'https://png.pngtree.com/png-clipart/20231117/original/pngtree-can-of-milo-drink-tinned-photo-png-image_13608323.png'
                  }}
                  alt={product.Product_Name}
                  width={500}
                  height={500}
                  resizeMode="cover"
                />
              </Box>
            </Box>

            {/* Right Side - Product Details */}
            <VStack flex={1} space="lg" pt="$4">
              {/* Product Name */}
              <Text size="3xl" fontWeight="$bold" color="$textLight900">
                {product.Product_Name}
              </Text>

              {/* Category Badge */}
              <Badge
                size="md"
                variant="solid"
                backgroundColor="$success100"
                borderColor="$success200"
                alignSelf="flex-start"
                borderRadius="$md"
              >
                <BadgeText color="$success700" fontWeight="$medium" fontSize="$sm">
                  {product.Category}
                </BadgeText>
              </Badge>

              {/* Points */}
              <HStack alignItems="baseline" space="xs">
                <Text size="4xl" fontWeight="$bold" color="$primary600">
                  {product.Points}
                </Text>
                <Text size="xl" color="$textLight600" fontWeight="$medium">
                  pts
                </Text>
              </HStack>

              {/* Product Description */}
              <Text size="md" color="$textLight600" lineHeight="$xl" mt="$4">
                {product.Product_Description}
              </Text>

              {/* Back Button */}
              <Button
                size="md"
                variant="solid"
                backgroundColor="$primary600"
                borderRadius="$lg"
                mt="$8"
                onPress={() => router.back()}
                maxWidth={120}
              >
                <HStack alignItems="center" space="sm">
                  <ArrowLeft size={18} color="white" />
                  <ButtonText color="$white" fontWeight="$semibold">
                    Back
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </HStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetailsPage;