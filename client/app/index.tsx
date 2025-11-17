import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) return null; // or a splash screen

  if (!user) {
    return <Redirect href="/(public)/catalogue" />;
  }

  if (role === "officer" || role === "developer") {
    return <Redirect href="/(admin)" />;
  }

  if (role === "resident") {
    return <Redirect href="/(resident)" />;
  }

  return <Redirect href="/(public)/catalogue" />;
}
