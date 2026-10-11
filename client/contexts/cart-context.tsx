import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
  id: number;
  productName: string;
  points: number;
  quantity: number;
  imageUrl?: string;
  tierLabel?: string | null;
  maxPerOrder?: number | null;
  isPreorder?: boolean;
}

const GLOBAL_MAX_QUANTITY = 10;

/** Max quantity allowed for an item in one order */
export const getMaxQuantity = (item: Pick<CartItem, "maxPerOrder">) =>
  Math.min(GLOBAL_MAX_QUANTITY, item.maxPerOrder ?? GLOBAL_MAX_QUANTITY);

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  totalPoints: number;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "@cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  };

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const addToCart = (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevCart.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, getMaxQuantity(i)) }
            : i
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...item, quantity: Math.min(quantity, getMaxQuantity(item)) }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, getMaxQuantity(item)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (productId: number): boolean => {
    return cart.some((item) => item.id === productId);
  };

  const getItemQuantity = (productId: number): number => {
    const item = cart.find((i) => i.id === productId);
    return item?.quantity || 0;
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPoints = cart.reduce(
    (sum, item) => sum + item.points * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        totalPoints,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
