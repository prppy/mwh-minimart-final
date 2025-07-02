import React from "react";
import { Box, HStack, Icon } from "@gluestack-ui/themed";
import { Feather } from "@expo/vector-icons";
import NavCard from "../../../components/NavCard";
import { router } from "expo-router";

const FeedbackPage = () => {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="white"
    >
      <HStack style={{ flexDirection: "row" }}>
        <NavCard
          icon={Feather}
          iconName="box"
          title="Product Request"
          description="Can’t find what you need?"
          onPress={() => router.push("/(tabs)/feedback/product-request")}
          style={{ marginRight: 60 }}
        />
        <NavCard
          icon={Feather}
          iconName="star"
          title="Rate Us"
          description="Tell us how to improve!"
          onPress={() => router.push("/(tabs)/feedback/rate-us")}
        />
      </HStack>
    </Box>
  );
};

export default FeedbackPage;
