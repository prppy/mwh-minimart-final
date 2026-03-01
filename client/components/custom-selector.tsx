import { LucideIcon } from "lucide-react-native";
import { Heading } from "./ui/heading";
import { HStack } from "./ui/hstack";
import { Icon } from "./ui/icon";
import { Pressable } from "./ui/pressable";
import { VStack } from "./ui/vstack";

type ColorSwatchProps = {
  color: string;
  selected: boolean;
  onPress: () => void;
};

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    className={`w-10 h-10 rounded-full bg-${color}scale-500 border-2 ${
      selected ? "border-" + color + "scale-700" : "border-white"
    }`}
  />
);

type StyleIconProps = {
  icon: LucideIcon;
  color: string;
  selected: boolean;
  onPress: () => void;
};

export const StyleIcon: React.FC<StyleIconProps> = ({
  icon,
  color,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    className={`w-10 h-10 justify-center items-center rounded-full ${
      selected ? "bg-" + color : "border-2 border-" + color
    }`}
  >
    <Icon as={icon} className={selected ? "text-white" : "text-" + color} size="xl" />
  </Pressable>
);

type SelectorProps = {
  title: string;
  children: React.ReactNode;
  colorTheme: string;
};

export const Selector: React.FC<SelectorProps> = ({
  title,
  children,
  colorTheme,
}) => (
  <VStack className="flex-1 gap-2 p-5 bg-white rounded-lg">
    <Heading className={colorTheme}>{title}</Heading>
    <HStack className="justify-between">{children}</HStack>
  </VStack>
);
