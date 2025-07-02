// import { Stack } from "expo-router";
// import "@/global.css";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { config } from "../components/ui/gluestack-ui-provider/config";
// import { GluestackUIProvider } from "@gluestack-ui/themed";
// export default function RootLayout() {
//   return (
//     <GluestackUIProvider config={config}>
//       <SafeAreaProvider>
//         <Stack screenOptions={{ headerShown: false }}>
//           <Stack.Screen name="(tabs)" />
//         </Stack>
//       </SafeAreaProvider>
//     </GluestackUIProvider>
//   );
// }

import { Stack } from "expo-router";
import "@/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GluestackUIProvider } from "@gluestack-ui/themed";

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
