import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Platform } from "react-native";
import Screensaver from "@/components/Screensaver";

export default function Index() {
  const { user, role, loading } = useAuth();
  const isWeb = Platform.OS === "web";
  const [showScreensaver, setShowScreensaver] = useState(!isWeb);

  // Show screensaver as landing page
  useEffect(() => {
    // If user is already logged in, skip screensaver after 2 seconds
    if (user && !isWeb) {
      const timer = setTimeout(() => setShowScreensaver(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isWeb]);

  if (loading) return null; // or a splash screen

  // Show screensaver for first-time visitors
  if (!user && showScreensaver && !isWeb) {
    return <Screensaver onInteraction={() => setShowScreensaver(false)} />;
  }

  // Redirect logic after screensaver
  if (!user) {
    return <Redirect href="/(public)" />;
  }

  if (role === "officer" || role === "developer") {
    return <Redirect href="/(admin)" />;
  }

  if (role === "resident") {
    return <Redirect href="/(resident)" />;
  }

  return <Redirect href="/(public)" />;
}
