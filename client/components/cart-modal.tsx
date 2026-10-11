import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingCart, Trash2, Plus, Minus, Ticket } from "lucide-react-native";

import { useCart, getMaxQuantity } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import api from "@/utils/api";
import { Order } from "@/utils/types";
import { orderNextStep } from "@/utils/orders";

import { Button, ButtonText } from "@/components/button";
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

type CheckoutResult =
  | { success: true; orders: Order[]; pointsDeducted: number; remainingPoints: number }
  | { success: false; message: string };

const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onOpenCart,
}) => {
  const router = useRouter();
  const { cart, totalPoints, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  // The login response doesn't include points, so fetch the live balance
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`users/${user.id}`);
      setUserPoints(res.data.data?.resident?.currentPoints ?? 0);
    } catch (error) {
      console.error("Failed to load points:", error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) fetchPoints();
  }, [isOpen, fetchPoints]);

  const pointsKnown = userPoints !== null;
  const canAfford = pointsKnown && userPoints >= totalPoints;
  const hasPreorder = cart.some((item) => item.isPreorder);

  const fail = (message: string) => {
    setCheckoutResult({ success: false, message });
    setShowConfirmation(true);
  };

  const handleCheckout = async () => {
    if (!user) return fail("Please log in to complete checkout.");
    if (cart.length === 0) return fail("Your cart is empty.");
    if (!canAfford) {
      return fail(
        `Insufficient points. You need ${totalPoints} points but only have ${userPoints ?? 0} points.`
      );
    }

    setLoading(true);
    try {
      const response = await api.post(
        "transactions/redemption",
        {
          userId: user.id,
          products: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
        },
        // Never retry a checkout automatically: it could redeem twice
        { retries: 0 }
      );

      const data = response.data.data;
      setCheckoutResult({
        success: true,
        orders: data.orders,
        pointsDeducted: data.pointsDeducted,
        remainingPoints: data.remainingPoints,
      });
      setUserPoints(data.remainingPoints);
      clearCart();
      setShowConfirmation(true);
    } catch (error: any) {
      console.error("Checkout error:", error);
      fail(error?.message || "Failed to complete checkout. Please try again.");
      fetchPoints();
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    if (checkoutResult?.success) onClose();
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
                <Icon as={ShoppingCart} size="xl" className="text-gray-400" />
                <Text className="text-gray-500">Your cart is empty</Text>
              </VStack>
            ) : (
              <ScrollView className="flex-1">
                <VStack space="md">
                  {cart.map((item) => {
                    const maxQuantity = getMaxQuantity(item);
                    const atMax = item.quantity >= maxQuantity;
                    const showTier =
                      !!item.tierLabel && !item.productName.includes(item.tierLabel);
                    return (
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
                            {showTier ? ` – ${item.tierLabel}` : ""}
                          </Text>
                          <Text className="text-indigoscale-600">
                            {item.points} pts × {item.quantity} ={" "}
                            {item.points * item.quantity} pts
                          </Text>
                          {(!!item.isPreorder || !!item.maxPerOrder) && (
                            <HStack space="sm">
                              {!!item.isPreorder && (
                                <Text className="text-xs font-semibold text-orangescale-700">
                                  Pre-order
                                </Text>
                              )}
                              {!!item.maxPerOrder && (
                                <Text className="text-xs text-gray-500">
                                  Max {item.maxPerOrder} per order
                                </Text>
                              )}
                            </HStack>
                          )}
                        </VStack>
                        <HStack space="xs" className="items-center">
                          <Pressable
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Icon as={Minus} size="sm" className="text-gray-600" />
                          </Pressable>
                          <Text className="w-8 text-center font-semibold">
                            {item.quantity}
                          </Text>
                          <Pressable
                            disabled={atMax}
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Icon
                              as={Plus}
                              size="sm"
                              className={atMax ? "text-gray-300" : "text-gray-600"}
                            />
                          </Pressable>
                          <Pressable onPress={() => removeFromCart(item.id)}>
                            <Icon as={Trash2} size="sm" className="text-red-600 ml-2" />
                          </Pressable>
                        </HStack>
                      </HStack>
                    );
                  })}
                </VStack>
              </ScrollView>
            )}

            {cart.length > 0 && (
              <VStack className="mt-4 p-4 bg-indigoscale-100 rounded-lg" space="sm">
                <HStack className="justify-between">
                  <Text className="font-semibold">Your Points:</Text>
                  <Text className="font-semibold">
                    {pointsKnown ? `${userPoints} pts` : "…"}
                  </Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="font-semibold">Total Cost:</Text>
                  <Text className="font-semibold text-indigoscale-700">
                    {totalPoints} pts
                  </Text>
                </HStack>
                {pointsKnown && (
                  <HStack className="justify-between">
                    <Text
                      className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}
                    >
                      {canAfford ? "Remaining:" : "Short by:"}
                    </Text>
                    <Text
                      className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(userPoints - totalPoints)} pts
                    </Text>
                  </HStack>
                )}
                {pointsKnown && !canAfford && (
                  <Text className="text-red-600 text-sm mt-2">
                    ⚠️ Insufficient points for checkout
                  </Text>
                )}
                {hasPreorder && (
                  <Text className="text-orangescale-700 text-sm mt-2">
                    Pre-order items get their own ticket. Points are deducted now
                    and staff will mark the ticket ready when the item arrives.
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
                className={canAfford ? "bg-indigoscale-700" : "bg-gray-400"}
              >
                {loading ? (
                  <CustomSpinner text="Processing..." />
                ) : (
                  <ButtonText>
                    {!pointsKnown ? "Checkout" : canAfford ? "Checkout" : "Insufficient Points"}
                  </ButtonText>
                )}
              </Button>
            )}
          </modal.ModalFooter>
        </modal.ModalContent>
      </modal.Modal>

      <alert.AlertDialog isOpen={showConfirmation} onClose={closeConfirmation}>
        <alert.AlertDialogBackdrop />
        <alert.AlertDialogContent>
          <alert.AlertDialogHeader>
            <Heading
              size="lg"
              className={checkoutResult?.success ? "text-green-600" : "text-red-600"}
            >
              {checkoutResult?.success ? "✅ Order placed!" : "❌ Error"}
            </Heading>
          </alert.AlertDialogHeader>
          <alert.AlertDialogBody>
            {checkoutResult?.success ? (
              <VStack space="md" className="mt-2">
                {checkoutResult.orders.map((order) => (
                  <VStack
                    key={order.id}
                    space="xs"
                    className="p-4 rounded-xl border-2 border-dashed border-indigoscale-300 bg-indigoscale-100"
                  >
                    <HStack space="sm" className="items-center">
                      <Icon as={Ticket} className="text-indigoscale-700" />
                      <Text bold className="text-indigoscale-700 text-lg">
                        {order.ticketLabel}
                      </Text>
                    </HStack>
                    {order.orderType === "preorder" && (
                      <Text className="text-xs font-semibold text-orangescale-700">
                        PRE-ORDER
                      </Text>
                    )}
                    <Text size="sm" className="text-gray-600">
                      {orderNextStep(order)}
                    </Text>
                  </VStack>
                ))}
                <Text size="sm" className="text-gray-600">
                  {checkoutResult.pointsDeducted} points used ·{" "}
                  {checkoutResult.remainingPoints} points left
                </Text>
              </VStack>
            ) : (
              <Text>{checkoutResult?.message}</Text>
            )}
          </alert.AlertDialogBody>
          <alert.AlertDialogFooter>
            {checkoutResult?.success ? (
              <Button
                variant="outline"
                action="secondary"
                onPress={() => {
                  closeConfirmation();
                  router.push("/(resident)/my-orders");
                }}
                className="mr-3"
              >
                <ButtonText>View My Orders</ButtonText>
              </Button>
            ) : (
              checkoutResult?.message.includes("Insufficient points") &&
              onOpenCart && (
                <Button
                  variant="outline"
                  action="secondary"
                  onPress={() => {
                    setShowConfirmation(false);
                    onOpenCart();
                  }}
                  className="mr-3"
                >
                  <ButtonText>Go to Cart</ButtonText>
                </Button>
              )
            )}
            <Button action="primary" onPress={closeConfirmation} className="bg-indigoscale-700">
              <ButtonText>OK</ButtonText>
            </Button>
          </alert.AlertDialogFooter>
        </alert.AlertDialogContent>
      </alert.AlertDialog>
    </>
  );
};

export default CartModal;
