import React from "react";
import { Text } from "@gluestack-ui/themed";
import { LIGHTEST_PURPLE } from "../constants/colors";

export const renderHighlightedText = (text: string, searchText: string) => {
  if (!searchText) return <Text>{text}</Text>;

  const regex = new RegExp(`(${searchText})`, "ig");
  const parts = text.split(regex);

  return (
    <Text>
      {parts.map((part, index) =>
        part.toLowerCase() === searchText.toLowerCase() ? (
          <Text
            key={index}
            style={{
              backgroundColor: LIGHTEST_PURPLE,
              borderRadius: 4,
              paddingHorizontal: 2,
            }}
          >
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};
