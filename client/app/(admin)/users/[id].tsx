import { useLocalSearchParams } from "expo-router";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <VStack className="flex-1 items-center justify-center p-4">
      <Text>User detail page for user {id} is not implemented yet.</Text>
    </VStack>
  );
}
