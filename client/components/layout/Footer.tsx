import { Divider } from "../ui/divider";
import { HStack } from "../ui/hstack";
import { Image } from "../ui/image";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";

const Footer: React.FC = () => {
  return (
    <VStack className="bg-white z-10 relative">
      <Divider />
      <HStack className="justify-center items-center">
        <Image source={require("@/assets/logo.png")} alt="MWH Logo" />
        <Text className="text-indigoscale-700" bold>
          MUHAMMADIYAH WELFARE HOME © 2025 | An institution of MUHAMMADIYAH
          ASSOCIATION
        </Text>
      </HStack>
    </VStack>
  );
};

export default Footer;
