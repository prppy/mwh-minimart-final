import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Eye } from "lucide-react-native";
import api from "@/utils/api";
import * as ImagePicker from "expo-image-picker";

// Get the backend URL for displaying uploaded images
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace('/api', '') || "http://localhost:3000";

interface ScreensaverImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
}

export default function ScreensaverManager() {
  const [images, setImages] = useState<ScreensaverImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/screensaver-images");
      setImages(response.data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch screensaver images");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library"
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (asset: any) => {
    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      
      // For web, we can use base64
      if (asset.base64) {
        const blob = await (await fetch(`data:image/jpeg;base64,${asset.base64}`)).blob();
        formData.append("image", blob, "screensaver.jpg");
      } else {
        // For mobile
        const file = {
          uri: asset.uri,
          type: "image/jpeg",
          name: "screensaver.jpg",
        } as any;
        formData.append("image", file);
      }

      const response = await api.post("/screensaver-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("Success", "Image uploaded successfully");
      await fetchImages();
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Check if it's the database table missing error
      if (error.response?.status === 503) {
        Alert.alert(
          "Database Setup Required",
          "The screensaver database table hasn't been created yet. Please ask your developer to run the SQL migration:\n\n" +
          "Go to Supabase SQL Editor and run:\n" +
          "CREATE TABLE IF NOT EXISTS \"MWH_Screensaver_Image\" (...)\n\n" +
          "For now, the screensaver will use default images.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", error.message || "Failed to upload image");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this screensaver image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/screensaver-images/${id}`);
              Alert.alert("Success", "Image deleted successfully");
              await fetchImages();
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete image");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handlePreview = (imageUrl: string) => {
    Alert.alert("Image Preview", imageUrl, [{ text: "Close" }]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading images...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="p-6" space="lg">
        {/* Header */}
        <VStack space="sm">
          <Heading size="2xl" className="text-indigoscale-900">
            Screensaver Manager
          </Heading>
          <Text className="text-gray-600">
            Manage images that will rotate on the screensaver. Add or remove
            images as needed.
          </Text>
        </VStack>

        {/* Add Image Button */}
        <Card className="p-4 bg-white">
          <VStack space="md">
            <HStack className="justify-between items-center">
              <VStack className="flex-1">
                <Heading size="md" className="text-indigoscale-900">
                  Add New Image
                </Heading>
                <Text className="text-gray-600 text-sm">
                  Upload images for the screensaver rotation
                </Text>
              </VStack>
              <Button
                onPress={handlePickImage}
                disabled={uploading}
                className="bg-indigoscale-700"
              >
                <ButtonIcon as={Plus} className="text-white" />
                <ButtonText className="text-white">
                  {uploading ? "Uploading..." : "Add Image"}
                </ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Card>

        {/* Images Grid */}
        <VStack space="md">
          <HStack className="justify-between items-center">
            <Heading size="lg" className="text-indigoscale-900">
              Current Images ({images.length})
            </Heading>
          </HStack>

          {images.length === 0 ? (
            <Card className="p-8 bg-white">
              <VStack className="items-center" space="sm">
                <Eye size={48} color="#9CA3AF" />
                <Text className="text-gray-600 text-center">
                  No screensaver images yet. Add your first image above.
                </Text>
                <Text className="text-gray-500 text-sm text-center">
                  Default images will be used until you add custom ones.
                </Text>
              </VStack>
            </Card>
          ) : (
            <VStack space="md">
              {images.map((image) => (
                <Card key={image.id} className="p-4 bg-white">
                  <HStack space="md" className="items-center">
                    {/* Image Preview */}
                    <Pressable onPress={() => handlePreview(image.imageUrl)}>
                      <Image
                        source={{ uri: `${BACKEND_URL}${image.imageUrl}` }}
                        style={{
                          width: 120,
                          height: 80,
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                    </Pressable>

                    {/* Image Info */}
                    <VStack className="flex-1" space="xs">
                      <Text className="text-sm font-semibold text-gray-900">
                        Image #{image.displayOrder}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Added: {new Date(image.createdAt).toLocaleDateString()}
                      </Text>
                    </VStack>

                    {/* Actions */}
                    <VStack space="xs">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600"
                        onPress={() => handleDeleteImage(image.id)}
                      >
                        <ButtonIcon as={Trash2} className="text-red-600" />
                        <ButtonText className="text-red-600">Delete</ButtonText>
                      </Button>
                    </VStack>
                  </HStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <VStack space="sm">
            <Heading size="sm" className="text-blue-900">
              ℹ️ How it works
            </Heading>
            <Text className="text-blue-800 text-sm">
              • Images rotate automatically every 5 seconds
            </Text>
            <Text className="text-blue-800 text-sm">
              • Screensaver activates after 5 minutes of inactivity
            </Text>
            <Text className="text-blue-800 text-sm">
              • You can add as many images as you want (minimum 1)
            </Text>
            <Text className="text-blue-800 text-sm">
              • Any interaction exits the screensaver
            </Text>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}
