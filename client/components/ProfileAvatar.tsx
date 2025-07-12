import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box } from "@gluestack-ui/themed";

interface ProfileAvatarProps {
  source?: any; // ideally ImageSourcePropType
  borderColor?: string;
  scale?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  source,
  borderColor = "#888",
  scale = 1,
}) => {
  const size = 32 * scale;

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5 * scale,
    marginRight: 8,
    backgroundColor: "#D9D9D9",
    borderColor,
  };

  return source ? (
    <Image source={source} style={avatarStyle} />
  ) : (
    <Box style={avatarStyle} />
  );
};

export default ProfileAvatar;
