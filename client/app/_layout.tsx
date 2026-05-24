import { Stack } from "expo-router";
import "react-native-reanimated";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState } from "react";
import { Pressable, Platform } from "react-native";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import Screensaver from "@/components/Screensaver";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function RootLayout() {
  const [showScreensaver, setShowScreensaver] = useState(false);
  const isWeb = Platform.OS === "web";

  const { resetTimer } = useIdleTimeout({
    timeout: IDLE_TIMEOUT,
    onIdle: () => {
      if (!isWeb) setShowScreensaver(true);
    },
    onActive: () => {
      if (!isWeb) setShowScreensaver(false);
    },
  });

  const handleInteraction = () => {
    if (!isWeb) {
      resetTimer();
      setShowScreensaver(false);
    }
  };

  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <CartProvider>
          {showScreensaver && !isWeb ? (
            <Screensaver onInteraction={handleInteraction} />
          ) : (
            <Pressable
              onPress={handleInteraction}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleInteraction}
              style={{ flex: 1 }}
            >
              <SafeAreaView style={{ flex: 1 }}>
                <Header />
                <Stack screenOptions={{ headerShown: false }} />
                <Footer />
              </SafeAreaView>
            </Pressable>
          )}
        </CartProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}



