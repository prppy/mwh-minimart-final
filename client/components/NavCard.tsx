import React, { ComponentType } from "react";
import { Box, VStack, Text, Pressable } from "@gluestack-ui/themed";
import { StyleProp, ViewStyle } from "react-native";
const mainColor = "#273C73";
interface NavCardProps {
  icon: React.ComponentType<any>;
  iconName: string;
  title: string;
  description: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const NavCard: React.FC<NavCardProps> = ({
  icon: IconComponent,
  iconName,
  title,
  description,
  onPress,
  style,
}) => {
  return (
    <Pressable onPress={onPress} style={style}>
      <Box
        borderWidth={1}
        borderColor="#ebeae8"
        borderRadius={15}
        padding={30}
        width={400}
        height={300}
        alignItems="center"
        justifyContent="center"
        backgroundColor="#ffffff"
        shadowColor="#000000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={3}
      >
        <VStack alignItems="center">
          <Box style={{ marginBottom: 20 }}>
            <IconComponent name={iconName} size={80} color={mainColor} />
          </Box>

          <Text
            color={mainColor}
            textAlign="center"
            style={{ marginBottom: 15, fontSize: 30, fontWeight: "bold" }}
          >
            {title}
          </Text>
          <Text fontSize={20} color="black" textAlign="center">
            {description}
          </Text>
        </VStack>
      </Box>
    </Pressable>
  );
};

export default NavCard;
