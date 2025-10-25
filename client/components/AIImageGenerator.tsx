import React, { useState } from "react";
import { StyleSheet, Alert, ActivityIndicator } from "react-native";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Input,
  InputField,
  Image,
  Pressable,
} from "@gluestack-ui/themed";
import api from "@/components/utility/api";

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  onImageAccepted: (imageUrl: string) => Promise<void>;
  borderColor?: string;
  size?: number;
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  onImageGenerated,
  onImageAccepted,
  borderColor = "#888",
  size = 300,
}) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert("Error", "Please enter a description for your image");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call your backend API endpoint
      const response = await api.post("images/generate", { prompt });
      const imageUrl = response.data.data.imageUrl;

      setGeneratedImageUrl(imageUrl);
      onImageGenerated(imageUrl);
    } catch (err: any) {
      console.error("Image generation error:", err);
      
      // Handle quota exceeded error
      if (err?.response?.status === 429 || err?.response?.data?.error?.type === 'QUOTA_EXCEEDED') {
        const retryAfter = err?.response?.data?.error?.retryAfter || 6;
        setError(`API quota exceeded. Please wait ${retryAfter} seconds and try again.`);
        Alert.alert(
          "Quota Exceeded", 
          `You've reached the free tier limit. Please wait ${retryAfter} seconds and try again, or upgrade your API plan.`
        );
      } else {
        setError("Failed to generate image. Please try again.");
        Alert.alert("Error", "Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptImage = async () => {
    if (!generatedImageUrl) return;

    setIsSaving(true);
    setError(null);

    try {
      await onImageAccepted(generatedImageUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
      setGeneratedImageUrl(null);
      setPrompt("");
    } catch (err) {
      console.error("Save image error:", err);
      setError("Failed to save image. Please try again.");
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImageUrl(null);
    setError(null);
  };

  return (
    <Box style={styles.container}>
      <VStack space="md">
        <Text style={styles.title}>Generate AI Profile Picture</Text>

        {!generatedImageUrl ? (
          <>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="Describe your profile picture (e.g., 'a friendly robot with blue eyes')"
                value={prompt}
                onChangeText={setPrompt}
                editable={!isGenerating}
              />
            </Input>

            <Button
              onPress={handleGenerateImage}
              disabled={isGenerating || !prompt.trim()}
              style={[styles.button, isGenerating && styles.disabledButton]}
            >
              {isGenerating ? (
                <HStack space="sm" alignItems="center">
                  <ActivityIndicator color="white" />
                  <ButtonText>Generating...</ButtonText>
                </HStack>
              ) : (
                <ButtonText>Generate Image</ButtonText>
              )}
            </Button>

            {isGenerating && (
              <Box style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>
                  Creating your AI-generated image...
                </Text>
                <Text style={styles.loadingSubtext}>
                  This may take 10-30 seconds
                </Text>
              </Box>
            )}
          </>
        ) : (
          <VStack space="lg" alignItems="center">
            <Box
              style={[
                styles.imagePreview,
                {
                  borderColor,
                  width: size,
                  height: size,
                },
              ]}
            >
              <Image
                source={{ uri: generatedImageUrl }}
                alt="Generated Profile Picture"
                style={styles.generatedImage}
                width={size}
                height={size}
              />
            </Box>

            <HStack space="md">
              <Button
                onPress={handleRegenerate}
                variant="outline"
                disabled={isSaving}
                style={styles.secondaryButton}
              >
                <ButtonText>Regenerate</ButtonText>
              </Button>

              <Button
                onPress={handleAcceptImage}
                disabled={isSaving}
                style={[styles.button, isSaving && styles.disabledButton]}
              >
                {isSaving ? (
                  <HStack space="sm" alignItems="center">
                    <ActivityIndicator color="white" />
                    <ButtonText>Saving...</ButtonText>
                  </HStack>
                ) : (
                  <ButtonText>Use This Image</ButtonText>
                )}
              </Button>
            </HStack>
          </VStack>
        )}

        {error && (
          <Box style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#8B5CF6",
  },
  secondaryButton: {
    borderColor: "#8B5CF6",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  imagePreview: {
    borderRadius: 150,
    overflow: "hidden",
    borderWidth: 5,
    backgroundColor: "white",
  },
  generatedImage: {
    borderRadius: 150,
  },
  errorContainer: {
    backgroundColor: "#FEE",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FCC",
  },
  errorText: {
    color: "#C00",
    fontSize: 14,
  },
});

export default AIImageGenerator;
