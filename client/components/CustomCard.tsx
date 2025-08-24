import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import { Image, ImageSourcePropType } from "react-native";
import { LIGHTEST_PURPLE } from "@/constants/colors";

type CustomCardProps = {
  title: string;
  points?: number;
  image?: ImageSourcePropType;
};

const CustomCard: React.FC<CustomCardProps> = ({ title, points, image }) => {
  return (
    <Box
      sx={styles.container}
      flex={1}
      marginHorizontal={10}
      paddingHorizontal={15}
    >
      <Box sx={styles.imageContainer} marginTop={15}>
        {image && <Image source={image} resizeMode="cover" />}
      </Box>
      <Text sx={styles.text}>{title}</Text>
      {points !== undefined && (
        <Text sx={styles.text} fontWeight={"600"}>
          {points} pts
        </Text>
      )}
    </Box>
  );
};

export default CustomCard;

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: 15,
    height: 350,
  },
  imageContainer: {
    backgroundColor: LIGHTEST_PURPLE,
    height: 247,
    overflow: "hidden", // ensures image respects border radius
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    marginTop: 10,
  },
};
