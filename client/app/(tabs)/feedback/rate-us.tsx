import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  Box,
  Center,
  Text,
  Input,
  VStack,
  Pressable,
  Button,
  ButtonText,
  InputField,
} from "@gluestack-ui/themed";

import RatingQuestion, {
  RatingOption,
} from "@/components/feedback/RatingQuestion";

const RateUsPage: React.FC = () => {
  const router = useRouter();

  const [productRating, setProductRating] = useState<RatingOption>(null);
  const [websiteRating, setWebsiteRating] = useState<RatingOption>(null);
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    const payload = {
      productSelection: productRating,
      websiteExperience: websiteRating,
      additionalFeedback: details,
    };

    console.log("Submitted Feedback:", payload);
    // TODO: send `payload` to server endpoint
  };

  return (
    <Center
      flex={1}
      style={{ backgroundColor: "white", paddingHorizontal: 10 }}
    >
      <Box
        borderWidth={1}
        borderColor="#ebeae8"
        borderRadius={15}
        padding={30}
        width={600}
        maxWidth="100%"
        alignItems="stretch"
        backgroundColor="$white"
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={3}
      >
        <VStack space="md">
          <RatingQuestion
            question="How do you like the selection of Minimart products?"
            value={productRating}
            onSelect={setProductRating}
          />
          <RatingQuestion
            question="How do you like the website?"
            value={websiteRating}
            onSelect={setWebsiteRating}
          />

          <Text fontSize="$xl" fontWeight="$medium" mb="$2" mt="$6">
            Details
          </Text>
          <Input variant="outline" borderRadius={10} height={100}>
            <InputField
              placeholder="Enter details here"
              fontSize="$xl"
              multiline
              onChangeText={setDetails}
              value={details}
              padding={5}
              style={{ marginTop: 10 }}
            />
          </Input>

          <Button
            size="xl"
            mt={20}
            width="100%"
            onPress={handleSubmit}
            backgroundColor="#D5442A"
          >
            <ButtonText>Submit</ButtonText>
          </Button>

          <Pressable onPress={() => router.back()}>
            <Text mt={20} color="$primary700" textAlign="center" fontSize="$xl">
              Back
            </Text>
          </Pressable>
        </VStack>
      </Box>
    </Center>
  );
};

export default RateUsPage;
