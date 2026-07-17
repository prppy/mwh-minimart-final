import React, { useEffect, useState } from "react";
import { Image, Pressable, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import api from "@/utils/api";

// Get the backend URL for loading uploaded images
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace('/api', '') || "http://localhost:3000";

// DEFAULT IMAGES - Used as fallback if no images are uploaded by officers
// To change these default images, replace the require() paths below with your own images
// Make sure the images are in the /client/assets/background/ folder
const DEFAULT_SCREENSAVER_IMAGES = [
  require("@/assets/background/art.png"),
  require("@/assets/background/education.png"),
  require("@/assets/background/games.png"),
  require("@/assets/background/nature.png"),
];

const IMAGE_DURATION = 5000; // 5 seconds per image
const FADE_DURATION = 1000; // 1 second fade transition

interface ScreensaverProps {
  onInteraction?: () => void;
}

export default function Screensaver({ onInteraction }: ScreensaverProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const opacity = useSharedValue(1);
  const { width, height } = Dimensions.get("window");

  // Fetch screensaver images from API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await api.get("/screensaver-images");
        if (response.data && response.data.length > 0) {
          console.log("Fetched screensaver images:", response.data);
          setImages(response.data.map((img: any) => img.imageUrl));
        } else {
          // Use default images if no images uploaded
          console.log("No custom images found, using defaults");
          setImages(DEFAULT_SCREENSAVER_IMAGES.map((_, index) => `default_${index}`));
        }
      } catch (error) {
        console.error("Failed to fetch screensaver images:", error);
        // Use default images on error
        setImages(DEFAULT_SCREENSAVER_IMAGES.map((_, index) => `default_${index}`));
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    // Rotate images every IMAGE_DURATION
    const interval = setInterval(() => {
      // Fade out
      opacity.value = withTiming(0, { duration: FADE_DURATION }, () => {
        // Change image in the middle of fade
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        // Fade in
        opacity.value = withTiming(1, { duration: FADE_DURATION });
      });
    }, IMAGE_DURATION);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleInteraction = () => {
    if (onInteraction) {
      onInteraction();
    } else {
      router.push("/(public)/catalogue");
    }
  };

  if (loading) {
    return (
      <Pressable
        onPress={handleInteraction}
        style={[styles.container, { width, height }]}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </Pressable>
    );
  }

  const currentImage = images[currentImageIndex];
  const isDefaultImage = currentImage?.startsWith("default_");
  
  // Construct full URL for uploaded images
  const imageSource = isDefaultImage
    ? DEFAULT_SCREENSAVER_IMAGES[parseInt(currentImage.split("_")[1])]
    : { uri: `${BACKEND_URL}${currentImage}` };

  // Debug logging
  if (!isDefaultImage) {
    console.log("Loading uploaded image:", `${BACKEND_URL}${currentImage}`);
  }

  return (
    <Pressable
      onPress={handleInteraction}
      style={[styles.container, { width, height }]}
    >
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image
          source={imageSource}
          style={[styles.image, { width, height }]}
          resizeMode="cover"
          onError={(error) => {
            console.error("Image load error:", error.nativeEvent.error);
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    flex: 1,
  },
});
