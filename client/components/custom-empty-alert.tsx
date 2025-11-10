import { CircleAlert } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "./ui/alert";
import { Center } from "./ui/center";

interface EmptyAlertProps {
  text: string;
}

const EmptyAlert: React.FC<EmptyAlertProps> = ({ text }) => {
  return (
    <Center className="flex-1">
      <Alert action="error" variant="solid">
        <AlertIcon as={CircleAlert} />
        <AlertText>{text}</AlertText>
      </Alert>
    </Center>
  );
};

export default EmptyAlert;
