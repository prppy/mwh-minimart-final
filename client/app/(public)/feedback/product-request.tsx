import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronDown } from "lucide-react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectInput, SelectIcon,
  SelectPortal, SelectBackdrop, SelectContent,
  SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";

import { submitProductRequest } from "@/utils/api/feedback";

const REQUEST_CATEGORIES = [
  { label: "Hygiene",     value: "hygiene"     },
  { label: "Snacks",      value: "snacks"      },
  { label: "Drinks",      value: "drinks"      },
  { label: "Electronics", value: "electronics" },
  { label: "Games",       value: "games"       },
  { label: "Books",       value: "books"       },
  { label: "Clothing",    value: "clothing"    },
  { label: "Other",       value: "other"       },
];

const ProductRequestPage: React.FC = () => {
  const router = useRouter();

  const [residentName,     setResidentName]     = useState("");
  const [productName,      setProductName]      = useState("");
  const [description,      setDescription]      = useState("");
  const [requestCategory,  setRequestCategory]  = useState("");
  const [submitting,       setSubmitting]        = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  async function handleSubmit() {
    if (!residentName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitProductRequest({
        residentName:    residentName.trim() || "Anonymous",
        productName:     productName.trim(),
        description:     description.trim(),
        requestCategory: requestCategory || null,
      });
      router.back();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
            {/* Name */}
            <Text className="text-indigoscale-700">Your Name</Text>
            <Input>
              <InputField
                placeholder="Enter your name"
                value={residentName}
                onChangeText={setResidentName}
              />
            </Input>

            {/* Product name */}
            <Text className="text-indigoscale-700">Product Name</Text>
            <Input>
              <InputField
                placeholder="What product would you like?"
                value={productName}
                onChangeText={setProductName}
              />
            </Input>

            {/* Category */}
            <Text className="text-indigoscale-700">Category (optional)</Text>
            <Select onValueChange={setRequestCategory}>
              <SelectTrigger size="md">
                <SelectInput placeholder="Select a category" />
                <SelectIcon className="mr-3" as={ChevronDown} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {REQUEST_CATEGORIES.map((item) => (
                    <SelectItem
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>

            {/* Description */}
            <Text className="text-indigoscale-700">Description (optional)</Text>
            <Textarea className="data-[focus=true]:border-indigoscale-700">
              <TextareaInput
                placeholder="Any additional details..."
                value={description}
                onChangeText={setDescription}
              />
            </Textarea>

            {/* Error */}
            {error && (
              <Text className="text-red-500 text-sm">{error}</Text>
            )}

            <Button
              action="primary"
              className="bg-redscale-500"
              onPress={handleSubmit}
              disabled={submitting}
            >
              <ButtonText>{submitting ? "Submitting..." : "Submit"}</ButtonText>
            </Button>

            <Button
              action="secondary"
              variant="link"
              onPress={() => router.back()}
            >
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