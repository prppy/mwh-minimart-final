import React from "react";
import {
  Box,
  Center,
  Text,
  Input,
  Button,
  VStack,
  Pressable,
  ButtonText,
  InputField,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
export default function ProductRequestPage() {
  return (
    <Center
      flex={1}
      style={{ backgroundColor: "white", paddingHorizontal: 10 }}
    >
      {/* padding left/right for margin */}
      <Box
        borderWidth={1}
        borderColor="#ebeae8"
        borderRadius={15}
        padding={30}
        width={500}
        maxWidth="100%" // make responsive on smaller screens
        alignItems="stretch" // stretch children width-wise
        backgroundColor="$white"
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={3}
      >
        <VStack space="md">
          {/* vertical stack with spacing */}
          <Box paddingVertical={15}>
            <Text mb={20} fontSize="$xl">
              Your Name
            </Text>
            <Input variant="outline" borderRadius={10} height={50}>
              <InputField placeholder="Enter name" fontSize="$xl" />
            </Input>
          </Box>
          <Box paddingVertical={10}>
            <Text mb={20} fontSize="$xl">
              Product Requested
            </Text>
            <Input variant="outline" borderRadius={10} height={50}>
              <InputField placeholder="Enter product name" fontSize="$xl" />
            </Input>
          </Box>
          <Button
            size="xl"
            mt={20}
            width="100%"
            onPress={() => alert("Submitted!")}
            backgroundColor="#D5442A" // TODO: change to color theme (secondary?)
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
}
