import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Star } from "lucide-react-native";

export function StarRow({ rating }: { rating: number }) {
  return (
    <HStack className="gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          as={Star}
          size="2xs"
          style={{ color: i < rating ? "#BA7517" : "#D3D1C7" }}
        />
      ))}
    </HStack>
  );
}