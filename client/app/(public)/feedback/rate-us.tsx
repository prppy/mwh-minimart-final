import SmileyRating from "@/components/custom-smiley-rating";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

const RateUsPage: React.FC = () => {
  const router = useRouter();

  const [productRating, setProductRating] = useState(0);
  const [websiteRating, setWebsiteRating] = useState(0);
  const [description, setDescription] = useState("");

  // TODO: send `payload` to server endpoint
  const handleSubmit = () => {
    const payload = {
      productSelection: productRating,
      websiteExperience: websiteRating,
      additionalFeedback: description,
    };

    console.log("Submitted Feedback:", payload);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Center className="flex-1 bg-white">
          <VStack
            className="w-1/3 p-5 border border-indigoscale-700 rounded-lg"
            space="lg"
          >
            <SmileyRating
              label="How do you like the selection of Minimart products?"
              value={productRating}
              onChange={setProductRating}
            />

            <SmileyRating
              label="How do you like the website?"
              value={websiteRating}
              onChange={setWebsiteRating}
            />

            <Text className="text-indigoscale-700">Details</Text>
            <Textarea className="data-[focus=true]:border-indigoscale-700">
              <TextareaInput
                placeholder="Enter Description"
                value={description}
                onChangeText={setDescription}
              />
            </Textarea>

            <Button action="primary" className="bg-redscale-500" onPress={handleSubmit}>
              <ButtonText>Submit</ButtonText>
            </Button>
            <Button action="secondary" variant="link" onPress={() => router.back()}>
              <ButtonIcon as={ChevronLeft} className="text-indigoscale-700" />
              <ButtonText className="text-indigoscale-700">Back</ButtonText>
            </Button>
          </VStack>
        </Center>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RateUsPage;
