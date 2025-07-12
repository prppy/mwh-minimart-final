import { HStack } from "@gluestack-ui/themed";
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const Users: React.FC = () => {
  return (
    <HStack style={styles.container}>
      <Text>AdminUsers</Text>
    </HStack>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    color: "#273C73",
  },
});

export default Users;
