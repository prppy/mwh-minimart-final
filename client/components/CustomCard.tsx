import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import { Image, ImageSourcePropType } from "react-native";
import { LIGHTEST_PURPLE } from "@/constants/colors";

// for now every page seems to have these details so i hope it's fine
type CustomCardProps = {
  title: string;
  points?: number;
  image?: ImageSourcePropType;
};

const CustomCard: React.FC<CustomCardProps> = ({ title, points, image }) => {
  return (
    // main card container
    <Box
      sx={styles.container}
      flex={1}
      marginHorizontal={10}
      paddingHorizontal={15}
    >
      {/* image container */}
      <Box sx={styles.imageContainer} marginTop={15}>
        {image && <Image source={image} resizeMode="contain" style={{ width: '90%', height: '90%' }} />}
      </Box>
      {/* title label: ALWAYS exist*/}
      <Text sx={styles.text}>{title}</Text>
      {/* points label: MIGHT exist */}
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
