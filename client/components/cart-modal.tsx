import React, { useState } from "react";
import { ScrollView } from "react-native";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react-native";

import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import api from "@/utils/api";

import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import * as modal from "@/components/ui/modal";
import * as alert from "@/components/ui/alert-dialog";
import { Pressable } from "@/components/ui/pressable";
import CustomSpinner from "@/components/custom-spinner";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void; // Callback to open cart from external triggers
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOpenCart }) => {
  const { cart, totalPoints, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const userPoints = (user as any)?.resident?.currentPoints || 0;
  const canAfford = userPoints >= totalPoints;

  const handleCheckout = async () => {
    if (!user) {
      setCheckoutResult({
        success: false,
        message: "Please login to complete checkout",
      });
      setShowConfirmation(true);
      return;
    }

    if (!canAfford) {
      setCheckoutResult({
        success: false,
        message: `Insufficient points. You need ${totalPoints} points but only have ${userPoints} points.`,
      });
      setShowConfirmation(true);
      return;
    }

    if (cart.length === 0) {
      setCheckoutResult({
        success: false,
        message: "Your cart is empty",
      });
      setShowConfirmation(true);
      return;
    }

    setLoading(true);
    try {
      const products = cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const response = await api.post("transactions/redemption", {
        userId: user.id,
        products,
      });

      if (response.data.success) {
        setCheckoutResult({
          success: true,
          message: `Successfully redeemed ${cart.length} item(s) for ${totalPoints} points!`,
        });
        clearCart();
        setShowConfirmation(true);
        
        // Refresh user data to update points
        // You may want to trigger a user data refresh here
      } else {
        throw new Error(response.data.error?.message || "Checkout failed");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setCheckoutResult({
        success: false,
        message:
          error.response?.data?.error?.message ||
          error.message ||
          "Failed to complete checkout. Please try again.",
      });
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <modal.Modal isOpen={isOpen} onClose={onClose} size="lg">
        <modal.ModalBackdrop />
        <modal.ModalContent className="max-h-[80vh]">
          <modal.ModalHeader>
            <HStack space="sm" className="items-center">
              <Icon as={ShoppingCart} className="text-indigoscale-700" />
              <Heading size="lg" className="text-indigoscale-700">
                Shopping Cart ({cart.length})
              </Heading>
            </HStack>
            <modal.ModalCloseButton />
          </modal.ModalHeader>

          <modal.ModalBody>
            {cart.length === 0 ? (
              <VStack className="items-center justify-center py-10" space="md">
                <Icon
                  as={ShoppingCart}
                  size="xl"
                  className="text-gray-400"
                />
                <Text className="text-gray-500">Your cart is empty</Text>
              </VStack>
            ) : (
              <ScrollView className="flex-1">
                <VStack space="md">
                  {cart.map((item) => (
                    <HStack
                      key={item.id}
                      className="bg-gray-50 p-3 rounded-lg items-center"
                      space="md"
                    >
                      {item.imageUrl && (
                        <Image
                          source={{ uri: item.imageUrl }}
                          alt={item.productName}
                          className="w-16 h-16 rounded-md"
                        />
                      )}
                      <VStack className="flex-1" space="xs">
                        <Text className="font-semibold">
                          {item.productName}
                        </Text>
                        <Text className="text-indigoscale-600">
                          {item.points} pts × {item.quantity} ={" "}
                          {item.points * item.quantity} pts
                        </Text>
                      </VStack>
                      <HStack space="xs" className="items-center">
                        <Pressable
                          onPress={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Icon
                            as={Minus}
                            size="sm"
                            className="text-gray-600"
                          />
                        </Pressable>
                        <Text className="w-8 text-center font-semibold">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Icon as={Plus} size="sm" className="text-gray-600" />
                        </Pressable>
                        <Pressable onPress={() => removeFromCart(item.id)}>
                          <Icon
                            as={Trash2}
                            size="sm"
                            className="text-red-600 ml-2"
                          />
                        </Pressable>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </ScrollView>
            )}

            {cart.length > 0 && (
              <VStack className="mt-4 p-4 bg-indigoscale-50 rounded-lg" space="sm">
                <HStack className="justify-between">
                  <Text className="font-semibold">Your Points:</Text>
                  <Text className="font-semibold">{userPoints} pts</Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="font-semibold">Total Cost:</Text>
                  <Text className="font-semibold text-indigoscale-700">
                    {totalPoints} pts
                  </Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}>
                    {canAfford ? "Remaining:" : "Short by:"}
                  </Text>
                  <Text className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(userPoints - totalPoints)} pts
                  </Text>
                </HStack>
                {!canAfford && (
                  <Text className="text-red-600 text-sm mt-2">
                    ⚠️ Insufficient points for checkout
                  </Text>
                )}
              </VStack>
            )}
          </modal.ModalBody>

          <modal.ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={onClose}
              className="mr-3"
            >
              <ButtonText>Close</ButtonText>
            </Button>
            {cart.length > 0 && (
              <Button
                action="primary"
                onPress={handleCheckout}
                disabled={loading || !canAfford}
                className={`${
                  canAfford
                    ? "bg-indigoscale-700"
                    : "bg-gray-400"
                }`}
              >
                {loading ? (
                  <CustomSpinner text="Processing..." />
                ) : (
                  <ButtonText>
                    {canAfford ? "Checkout" : "Insufficient Points"}
                  </ButtonText>
                )}
              </Button>
            )}
          </modal.ModalFooter>
        </modal.ModalContent>
      </modal.Modal>

      <alert.AlertDialog
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          if (checkoutResult?.success) {
            onClose();
          }
        }}
      >
        <alert.AlertDialogBackdrop />
        <alert.AlertDialogContent>
          <alert.AlertDialogHeader>
            <Heading
              size="lg"
              className={
                checkoutResult?.success
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {checkoutResult?.success ? "✅ Success!" : "❌ Error"}
            </Heading>
          </alert.AlertDialogHeader>
          <alert.AlertDialogBody>
            <Text>{checkoutResult?.message}</Text>
          </alert.AlertDialogBody>
          <alert.AlertDialogFooter>
            {!checkoutResult?.success && checkoutResult?.message.includes("Insufficient points") && (
              <Button
                variant="outline"
                action="secondary"
                onPress={() => {
                  setShowConfirmation(false);
                  if (onOpenCart) {
                    onOpenCart();
                  }
                }}
                className="mr-3"
              >
                <ButtonText>Go to Cart</ButtonText>
              </Button>
            )}
            <Button
              action="primary"
              onPress={() => {
                setShowConfirmation(false);
                if (checkoutResult?.success) {
                  onClose();
                }
              }}
              className="bg-indigoscale-700"
            >
              <ButtonText>OK</ButtonText>
            </Button>
          </alert.AlertDialogFooter>
        </alert.AlertDialogContent>
      </alert.AlertDialog>
    </>
  );
};

export default CartModal;
