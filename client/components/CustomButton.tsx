import React, { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { MAIN_PURPLE } from "@/constants/colors";
interface CustomButtonProps {
  isActive: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  isActive,
  onPress,
  children,
  style,
  textStyle,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.button, isActive ? styles.active : styles.inactive, style]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          isActive ? styles.textActive : styles.textInactive,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
    height: 40,
    width: 100,
    borderWidth: 1,
    borderColor: MAIN_PURPLE,
  },
  active: {
    backgroundColor: "#273C73",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  inactive: {
    backgroundColor: "white",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    textAlign: "center",
    fontWeight: "600",
  },
  textActive: {
    color: "#fff",
  },
  textInactive: {
    color: "#333",
  },
});
