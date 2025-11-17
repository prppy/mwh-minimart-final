import * as alert from "./ui/alert-dialog";
import { Button, ButtonText } from "./ui/button";
import { Heading } from "./ui/heading";
import { Text } from "./ui/text";

interface ErrorDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  errorHeading: string;
  errorMessage: string;
}

const ErrorDialogue: React.FC<ErrorDialogueProps> = ({
  isOpen,
  onClose,
  errorHeading,
  errorMessage,
}) => {
  return (
    <alert.AlertDialog isOpen={isOpen} onClose={onClose} size="sm">
      <alert.AlertDialogBackdrop />
      <alert.AlertDialogContent>
        <alert.AlertDialogHeader>
          <Heading className="text-typography-950 font-semibold" size="md">
            {errorHeading}
          </Heading>
        </alert.AlertDialogHeader>
        <alert.AlertDialogBody className="mt-3 mb-4">
          <Text size="sm">{errorMessage}</Text>
        </alert.AlertDialogBody>
        <alert.AlertDialogFooter>
          <Button action="primary" size="sm" onPress={onClose}>
            <ButtonText>Ok</ButtonText>
          </Button>
        </alert.AlertDialogFooter>
      </alert.AlertDialogContent>
    </alert.AlertDialog>
  );
};

export default ErrorDialogue;
