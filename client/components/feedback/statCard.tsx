import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <VStack
      className="flex-1 bg-white rounded-2xl p-3 gap-1"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      <Text className="text-xs text-typography-400">{label}</Text>
      <Text className="text-xl font-bold" style={{ color: accent ?? "#2C2C2A" }}>
        {value}
      </Text>
    </VStack>
  );
}