import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Product {
  Product_ID: number;
  Product_Name: string;
  Product_Description: string;
  Points: number;
  Category: string;
}

const CataloguePage: React.FC = () => {
  const router = useRouter();
  
  const products: Product[] = [
    { Product_ID: 1, Product_Name: 'Toothpaste', Product_Description: 'Let\'s practice good oral hygiene together!', Points: 10, Category: 'Hygiene' },
    { Product_ID: 2, Product_Name: 'Shampoo', Product_Description: 'Revitalizing Shampoo for all hair types', Points: 3, Category: 'Toiletries' },
    { Product_ID: 3, Product_Name: 'Conditioner', Product_Description: 'Moisturizing Conditioner for dry hair', Points: 3, Category: 'Toiletries' },
  ];

  const handleProductPress = (product: Product) => {
    // Pass the entire product object as parameters
    router.push({
      pathname: `/catalogue/${product.Product_ID}`,
      params: {
        Product_ID: product.Product_ID.toString(),
        Product_Name: product.Product_Name,
        Product_Description: product.Product_Description,
        Points: product.Points.toString(),
        Category: product.Category,
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Product Catalogue</Text>
      {products.map((product) => (
        <TouchableOpacity
          key={product.Product_ID}
          style={styles.productCard}
          onPress={() => handleProductPress(product)}
        >
          <Text style={styles.productName}>{product.Product_Name}</Text>
          <Text style={styles.productPrice}>{product.Points} Points</Text>
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