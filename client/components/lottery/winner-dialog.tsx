import React from "react";
import { View, Animated } from "react-native";
import { Trophy, AlertCircle, CheckCircle2, XCircle } from "lucide-react-native";

import * as alert from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";

type RedemptionStatus = "idle" | "loading" | "success" | "error";

interface WinnerDialogProps {
  winner: string | null;
  onClose: () => void;
  selectedItemName?: string;
  redemptionStatus: RedemptionStatus;
  redemptionError: string | null;
}

const WinnerDialog: React.FC<WinnerDialogProps> = ({
  winner,
  onClose,
  selectedItemName,
  redemptionStatus,
  redemptionError,
}) => {
  const isError = winner?.startsWith("Error");

  return (
    <alert.AlertDialog isOpen={!!winner} onClose={onClose}>
      <alert.AlertDialogBackdrop />
      <alert.AlertDialogContent
        style={{
          borderRadius: 24,
          overflow: "hidden",
          maxWidth: 400,
          width: "90%",
          alignSelf: "center",
        }}
      >
        {/* Decorative top bar */}
        <View
          style={{
            height: 6,
            backgroundColor: isError ? "#EF4444" : "#22C55E",
            width: "100%",
          }}
        />

        <alert.AlertDialogBody style={{ padding: 24 }}>
          <VStack space="lg" style={{ alignItems: "center" }}>
            {/* Icon */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: isError ? "#FEF2F2" : "#F0FDF4",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                as={isError ? AlertCircle : Trophy}
                size="xl"
                style={{ color: isError ? "#EF4444" : "#22C55E", width: 36, height: 36 }}
              />
            </View>

            {/* Title */}
            <Heading
              size="xl"
              style={{
                textAlign: "center",
                color: isError ? "#991B1B" : "#166534",
              }}
            >
              {isError ? "Oops!" : "🎉 We have a winner!"}
            </Heading>

            {/* Winner name */}
            <View
              style={{
                backgroundColor: isError ? "#FEF2F2" : "#F0FDF4",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isError ? "#FECACA" : "#BBF7D0",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: isError ? "#DC2626" : "#15803D",
                  textAlign: "center",
                }}
              >
                {winner}
              </Text>
            </View>

            {/* Redemption status */}
            {selectedItemName && !isError && (
              <VStack space="xs" style={{ alignItems: "center", width: "100%" }}>
                <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
                  Redeeming: {selectedItemName}
                </Text>
                {redemptionStatus === "loading" && (
                  <HStack className="items-center gap-2" style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>Processing...</Text>
                  </HStack>
                )}
                {redemptionStatus === "success" && (
                  <HStack className="items-center gap-2" style={{ marginTop: 4 }}>
                    <Icon as={CheckCircle2} size="sm" style={{ color: "#22C55E" }} />
                    <Text style={{ fontSize: 13, color: "#22C55E", fontWeight: "600" }}>
                      Redeemed successfully!
                    </Text>
                  </HStack>
                )}
                {redemptionStatus === "error" && (
                  <HStack className="items-center gap-2" style={{ marginTop: 4 }}>
                    <Icon as={XCircle} size="sm" style={{ color: "#EF4444" }} />
                    <Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "500" }}>
                      {redemptionError || "Redemption failed"}
                    </Text>
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>
        </alert.AlertDialogBody>

        <alert.AlertDialogFooter style={{ padding: 16, paddingTop: 0 }}>
          <Button
            action="primary"
            size="lg"
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: isError ? "#EF4444" : "#273C73",
              borderRadius: 14,
            }}
          >
            <ButtonText style={{ fontWeight: "700" }}>
              {isError ? "Try Again" : "Awesome!"}
            </ButtonText>
          </Button>
        </alert.AlertDialogFooter>
      </alert.AlertDialogContent>
    </alert.AlertDialog>
  );
};

export default WinnerDialog;
