import { Divider } from "../ui/divider";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { Image } from "../ui/image";
import { Text } from "../ui/text";
import { useWindowDimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

const Footer: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  return (
    <VStack className="bg-white z-10 relative">
      <Divider />
      {isMobile ? (
        <VStack className="items-center py-3 px-4" space="xs">
          <Image
            source={require("@/assets/logo.png")}
            alt="MWH Logo"
            size="sm"
          />
          <Text
            className="text-indigoscale-700 text-center"
            size="xs"
            bold
          >
            MUHAMMADIYAH WELFARE HOME © 2025
          </Text>
          <Text
            className="text-indigoscale-500 text-center"
            size="xs"
          >
            An institution of MUHAMMADIYAH ASSOCIATION
          </Text>
        </VStack>
      ) : (
        <HStack className="justify-center items-center py-1 px-4">
          <Image source={require("@/assets/logo.png")} alt="MWH Logo" />
          <Text className="text-indigoscale-700" bold>
            MUHAMMADIYAH WELFARE HOME © 2025 | An institution of MUHAMMADIYAH
            ASSOCIATION
          </Text>
        </HStack>
      )}
    </VStack>
  );
};

export default Footer;
