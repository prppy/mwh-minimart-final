import React from "react";
import { Box, Text, HStack } from "@gluestack-ui/themed";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type RatingOption = "happy" | "neutral" | "sad" | null;
import { setHSLlightness, hslToHSLA } from "@/utils/styleUtils";

const RatingColors: Record<RatingValue, string> = {
  sad: "hsl(2, 67%, 50%)",
  happy: "hsl(101, 67%, 50%)",
  neutral: "hsl(55, 67%, 50%)",
};

type RatingValue = Exclude<RatingOption, null>; // "happy" | "neutral" | "sad"

interface RatingQuestionProps {
  question: string;
  value: RatingOption;
  onSelect: (value: RatingOption) => void;
}

const RatingQuestion: React.FC<RatingQuestionProps> = ({
  question,
  value,
  onSelect,
}) => {
  const options: RatingValue[] = ["happy", "neutral", "sad"];

  const iconMap: Record<RatingValue, keyof typeof MaterialIcons.glyphMap> = {
    happy: "sentiment-very-satisfied",
    neutral: "sentiment-neutral",
    sad: "sentiment-very-dissatisfied",
  };

  return (
    <Box mt="$4">
      <Text fontSize="$xl" fontWeight="$medium" mb="$5">
        {question}
      </Text>
      <HStack space="xl" justifyContent="space-around">
        {options.map((option) => {
          const color = RatingColors[option];
          const isSelected = value === option;
          const darkerBg = isSelected
            ? setHSLlightness(color, 90)
            : "transparent";

          return (
            <Box
              key={option}
              borderRadius={100}
              bg={darkerBg}
              style={{
                borderColor: isSelected ? color : "transparent",
                borderWidth: isSelected ? 1 : 0,
              }}
            >
              <MaterialIcons
                name={iconMap[option]}
                size={50}
                color={color}
                onPress={() => onSelect(option)}
              />
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
};

export default RatingQuestion;
