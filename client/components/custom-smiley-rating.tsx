import { Frown, Meh, Smile } from "lucide-react-native";
import { HStack } from "./ui/hstack";
import { Pressable } from "./ui/pressable";
import { Text } from "./ui/text";

type SmileyRatingProps = {
  label: string;
  value: number | null;
  onChange: (val: number) => void;
};

const SmileyRating: React.FC<SmileyRatingProps> = ({ label, value, onChange }) => {
  return (
    <>
      <Text className="text-indigoscale-700 mb-2">{label}</Text>
      <HStack className="justify-around">
        <Pressable onPress={() => onChange(1)}>
          <Smile size={32} color={value === 1 ? "green" : "gray"} />
        </Pressable>
        <Pressable onPress={() => onChange(2)}>
          <Meh size={32} color={value === 2 ? "orange" : "gray"} />
        </Pressable>
        <Pressable onPress={() => onChange(3)}>
          <Frown size={32} color={value === 3 ? "red" : "gray"} />
        </Pressable>
      </HStack>
    </>
  );
};

export default SmileyRating;