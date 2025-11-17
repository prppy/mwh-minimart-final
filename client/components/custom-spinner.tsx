import { Center } from "./ui/center";
import { Spinner } from "./ui/spinner";
import { Text } from "./ui/text";

interface CustomSpinnerProps {
  text?: string;
}

const CustomSpinner: React.FC<CustomSpinnerProps> = ({ text }) => {
  return (
    <Center className="flex-1 h-full gap-2">
      <Spinner size="large" />
      {text && (
        <Text size="md" className="text-indigoscale-700">
          {text}
        </Text>
      )}
    </Center>
  );
};

export default CustomSpinner;
