import { Frown, LucideIcon, Meh, Smile } from "lucide-react-native";
import { Pressable } from "react-native";
import { HStack } from "./ui/hstack";
import { Text } from "./ui/text";

type SmileyRatingProps = {
  label: string;
  value: number | null;
  onChange: (val: number) => void;
};

const FACES: { value: number; icon: LucideIcon; color: string; label: string }[] = [
  { value: 1, icon: Frown, color: "#DC2626", label: "Bad" },
  { value: 2, icon: Meh, color: "#EA580C", label: "Okay" },
  { value: 3, icon: Smile, color: "#16A34A", label: "Good" },
];

/** Faces light up in their colour on hover, and stay filled once chosen */
const SmileyRating: React.FC<SmileyRatingProps> = ({ label, value, onChange }) => {
  return (
    <>
      <Text className="text-indigoscale-700 mb-2">{label}</Text>
      <HStack className="justify-around">
        {FACES.map(({ value: faceValue, icon: Face, color, label: faceLabel }) => (
          <Pressable
            key={faceValue}
            onPress={() => onChange(faceValue)}
            accessibilityRole="button"
            accessibilityLabel={faceLabel}
            style={({ hovered, pressed }: any) => ({
              padding: 8,
              borderRadius: 999,
              backgroundColor:
                value === faceValue ? `${color}22` : hovered || pressed ? `${color}14` : "transparent",
              transform: [{ scale: hovered || pressed ? 1.15 : 1 }],
            })}
          >
            {({ hovered, pressed }: any) => (
              <Face size={32} color={value === faceValue || hovered || pressed ? color : "gray"} />
            )}
          </Pressable>
        ))}
      </HStack>
    </>
  );
};

export default SmileyRating;
