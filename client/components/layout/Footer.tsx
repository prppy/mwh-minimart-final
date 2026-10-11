import { Divider } from "../ui/divider";
import { VStack } from "../ui/vstack";
import { Text } from "../ui/text";
import { MINIMART_DISCLAIMER } from "@/constants/policy";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <VStack className="bg-white z-10 relative">
      <Divider />
      <VStack className="items-center py-3 px-4" space="xs">
        <Text className="text-indigoscale-700 text-center" size="xs" bold>
          MUHAMMADIYAH WELFARE HOME © {year} | An institution of MUHAMMADIYAH ASSOCIATION
        </Text>
        <Text className="text-gray-500 text-center" size="xs">
          {MINIMART_DISCLAIMER}
        </Text>
      </VStack>
    </VStack>
  );
};

export default Footer;
