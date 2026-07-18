import React, { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import { vars } from "nativewind";
import { useColorScheme } from "nativewind";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";
import { themeTokens, type ThemeMode } from "@/theme/tokens";

const nativewindTheme = {
  light: vars(themeTokens.light),
  dark: vars(themeTokens.dark),
};

export function GluestackUIProvider({
  mode = "light",
  ...props
}: {
  mode?: ThemeMode | "system";
  children?: React.ReactNode;
  style?: ViewProps["style"];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  const resolvedScheme = colorScheme === "dark" ? "dark" : "light";

  return (
    <View
      style={[
        nativewindTheme[resolvedScheme],
        { flex: 1, height: "100%", width: "100%" },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
