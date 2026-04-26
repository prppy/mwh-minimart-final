import SmileyRating from "@/components/custom-smiley-rating";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { submitRating } from "@/utils/api/feedback";

const FEEDBACK_CATEGORIES = [
  { label: "General",    value: "general"    },
  { label: "Product",    value: "product"    },
  { label: "Service",    value: "service"    },
  { label: "Facility",   value: "facility"   },
  { label: "Suggestion", value: "suggestion" },
  { label: "Complaint",  value: "complaint"  },
];

const RateUsPage: React.FC = () => {
  const router = useRouter();

  const [residentName,     setResidentName]     = useState("");
  const [rating,           setRating]           = useState<number | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState("");
  const [feedback,         setFeedback]         = useState("");
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitRating({
        residentName:     residentName.trim() || "Anonymous",
        rating,
        feedbackCategory: feedbackCategory || null,
        feedback:         feedback.trim(),
      });
      router.back();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
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
            {/* Name */}
            <Text className="text-indigoscale-700">Your Name (optional)</Text>
            <Input>
              <InputField
                placeholder="Enter your name"
                value={residentName}
                onChangeText={setResidentName}
              />
            </Input>

            {/* Single rating */}
            <SmileyRating
              label="How was your overall experience?"
              value={rating}
              onChange={setRating}
            />

            {/* Category */}
            <Text className="text-indigoscale-700">Feedback Type (optional)</Text>
            <Select onValueChange={setFeedbackCategory}>
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
                  {FEEDBACK_CATEGORIES.map((item) => (
                    <SelectItem
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>

            {/* Details */}
            <Text className="text-indigoscale-700">Details (optional)</Text>
            <Textarea className="data-[focus=true]:border-indigoscale-700">
              <TextareaInput
                placeholder="Tell us more..."
                value={feedback}
                onChangeText={setFeedback}
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

export default RateUsPage;