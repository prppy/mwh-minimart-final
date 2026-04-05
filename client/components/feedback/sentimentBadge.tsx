import { Frown, Meh, Smile } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

const SENTIMENT = {
  1: { icon: Frown, color: "#A32D2D", bg: "#FCEBEB", label: "Poor"    },
  2: { icon: Meh,   color: "#854F0B", bg: "#FAEEDA", label: "Okay"    },
  3: { icon: Smile, color: "#0F6E56", bg: "#E1F5EE", label: "Happy"   },
} as const;

export function SentimentBadge({ rating }: { rating: 1 | 2 | 3 }) {
  const s = SENTIMENT[rating] ?? SENTIMENT[2];
  return (
    <HStack
      className="items-center gap-1 px-2 py-1 rounded-lg"
      style={{ backgroundColor: s.bg }}
    >
      <Icon as={s.icon} size="2xs" style={{ color: s.color }} />
      <Text style={{ fontSize: 11, fontWeight: 600, color: s.color }}>
        {s.label}
      </Text>
    </HStack>
  );
}