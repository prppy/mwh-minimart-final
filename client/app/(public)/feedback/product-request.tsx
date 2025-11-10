import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import api from "@/utils/api";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const ProductRequestPage: React.FC = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  // TODO: streamline the model structure, dissonance between db and frontend
  const handleSubmit = async () => {
    try {
      const res = await api.post("/feedback/product-request", {
        productName,
        description,
        category: "electronics",
        urgency: "medium",
      });

      if (res.data.success) {
        router.back();
      } else {
        console.log(res.data.error?.message || "Unknown error");
      }
    } catch (err: any) {
      console.error("Submit rating error:", err);
    }
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
            <Text className="text-indigoscale-700">Your Name</Text>
            <Input>
              <InputField
                placeholder="Enter Name"
                value={name}
                onChangeText={setName}
              />
            </Input>

            <Text className="text-indigoscale-700">Product Name</Text>
            <Input>
              <InputField
                placeholder="Enter Product Name"
                value={productName}
                onChangeText={setProductName}
              />
            </Input>

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

export default ProductRequestPage;
