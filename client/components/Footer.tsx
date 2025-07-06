import { HStack } from "@gluestack-ui/themed";
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const Footer: React.FC = () => {
  return (
    <HStack style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        alt="MWH Logo"
        style={{ width: 80, height: 80 }}
      />

      <Text style={styles.text}>
        MUHAMMADIYAH WELFARE HOME © 2025 |  An institution of MUHAMMADIYAH
        ASSOCIATION
      </Text>
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

export default Footer;
