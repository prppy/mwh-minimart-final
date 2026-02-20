import * as alert from "../ui/alert-dialog";
import { Button, ButtonText } from "../ui/button";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";

interface DiscardDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  heading: string;
  message: string;
}

const DiscardDialogue: React.FC<DiscardDialogueProps> = ({
  isOpen,
  onClose,
  onDiscard,
  heading,
  message,
}) => {
  return (
    <alert.AlertDialog isOpen={isOpen} onClose={onClose} size="sm">
      <alert.AlertDialogBackdrop />
      <alert.AlertDialogContent>
        <alert.AlertDialogHeader>
          <Heading className="text-typography-950 font-semibold" size="md">
            {heading}
          </Heading>
        </alert.AlertDialogHeader>
        <alert.AlertDialogBody className="mt-3 mb-4">
          <Text size="sm">{message}</Text>
        </alert.AlertDialogBody>
        <alert.AlertDialogFooter>
          <Button
            variant="outline"
            action="secondary"
            size="sm"
            onPress={onClose}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="negative" size="sm" onPress={onDiscard}>
            <ButtonText>Discard</ButtonText>
          </Button>
        </alert.AlertDialogFooter>
      </alert.AlertDialogContent>
    </alert.AlertDialog>
  );
};

export default DiscardDialogue;
