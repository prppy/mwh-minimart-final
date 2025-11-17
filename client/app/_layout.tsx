import { Stack } from "expo-router";
import "react-native-reanimated";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Header />
          <Stack screenOptions={{ headerShown: false }} />
          <Footer />
        </SafeAreaView>
      </AuthProvider>
    </GluestackUIProvider>
  );
}
