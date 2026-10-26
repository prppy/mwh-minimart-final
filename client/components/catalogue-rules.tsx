import { Info } from "lucide-react-native";

import { MINIMART_DISCLAIMER, MINIMART_RULES } from "@/constants/policy";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

// "Points to note" panel above the catalogue's category list
const CatalogueRules: React.FC = () => (
  <VStack className="p-3 bg-indigoscale-100 rounded-lg" space="xs">
    <HStack className="items-center" space="xs">
      <Icon as={Info} size="sm" className="text-indigoscale-700" />
      <Text size="sm" className="text-indigoscale-700 font-semibold">Points to note</Text>
    </HStack>
    {MINIMART_RULES.map((rule) => (
      <HStack key={rule} space="xs">
        <Text size="xs" className="text-gray-600">
          •
        </Text>
        <Text size="xs" className="text-gray-600 flex-1">
          {rule}
        </Text>
      </HStack>
    ))}
    <Text size="2xs" className="text-gray-500 italic mt-1">
      {MINIMART_DISCLAIMER}
    </Text>
  </VStack>
);

export default CatalogueRules;
