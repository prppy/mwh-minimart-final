import React from "react";
import { Image, View, ViewStyle } from "react-native";

const logo = require("@/assets/logo.png");

// assets/logo.png is 512×256 with a white border around the artwork. This
// crops it to the artwork (≈470×120) the same way the login design does.
const VISIBLE_ASPECT = 470 / 120;
const IMAGE_SCALE = 1.089; // image width relative to the visible window
const OFFSET_X = -0.043; // fractions of the window width
const OFFSET_Y = -0.149;

interface BrandLogoProps {
  width: number;
  style?: ViewStyle;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ width, style }) => {
  const imageWidth = width * IMAGE_SCALE;
  return (
    <View
      style={[
        {
          width,
          height: width / VISIBLE_ASPECT,
          overflow: "hidden",
          mixBlendMode: "multiply", // white logo background blends into tinted backgrounds
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Muhammadiyah Welfare Home Minimart"
    >
      <Image
        source={logo}
        resizeMode="contain"
        style={{
          width: imageWidth,
          height: imageWidth / 2, // source is 2:1
          marginLeft: width * OFFSET_X,
          marginTop: width * OFFSET_Y,
        }}
      />
    </View>
  );
};

export default BrandLogo;
