import React from "react";
import { HStack } from "@gluestack-ui/themed";
import CustomButton from "@/components/CustomButton";

// for typing..
type SpaceSizes = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

interface RoleOptionsProps {
  selectedRole: "residents" | "officers" | null;
  onChange: (role: "residents" | "officers") => void;
  space?: SpaceSizes;
}

const RoleOptions: React.FC<RoleOptionsProps> = ({
  selectedRole,
  onChange,
  space = "xl",
}) => {
  return (
    <HStack space={space}>
      <CustomButton
        isActive={selectedRole === "residents"}
        onPress={() => onChange("residents")}
      >
        Residents
      </CustomButton>

      <CustomButton
        isActive={selectedRole === "officers"}
        onPress={() => onChange("officers")}
      >
        Officers
      </CustomButton>
    </HStack>
  );
};

export default RoleOptions;
