import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Product {
  id: string;
  name: string;
  price: string;
}

const CataloguePage: React.FC = () => {
  const router = useRouter();

  const products: Product[] = [
    { id: '1', name: 'Product 1', price: '$29.99' },
    { id: '2', name: 'Product 2', price: '$49.99' },
    { id: '3', name: 'Product 3', price: '$19.99' },
  ];

  const handleProductPress = (productId: string) => {
    router.push(`/catalogue/${productId}` as any);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Product Catalogue</Text>
      {products.map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.productCard}
          onPress={() => handleProductPress(product.id)}
        >
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default CataloguePage;