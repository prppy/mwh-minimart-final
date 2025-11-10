import { HStack } from "../ui/hstack";
import { Image } from "../ui/image";
import { Text } from "../ui/text";

const Footer: React.FC = () => {
  return (
    <HStack className="justify-center items-center">
      <Image source={require("@/assets/logo.png")} alt="MWH Logo" />
      <Text className="text-indigoscale-700" bold>
        MUHAMMADIYAH WELFARE HOME © 2025 | An institution of MUHAMMADIYAH
        ASSOCIATION
      </Text>
    </HStack>
  );
};

export default Footer;
