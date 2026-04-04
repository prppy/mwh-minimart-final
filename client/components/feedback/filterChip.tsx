import { TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  danger?: boolean;
}

export function FilterChip({ label, active, onPress, danger }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: active ? (danger ? "#A32D2D" : "#3C3489") : "#F1EFE8",
        borderWidth: 0.5,
        borderColor: active ? (danger ? "#A32D2D" : "#3C3489") : "#D3D1C7",
      }}
    >
      <Text
        className="text-xs font-medium"
        style={{ color: active ? "#FFFFFF" : "#5F5E5A" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}