import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { authAPI, User } from "../utils/auth";

type Role = "resident" | "officer" | "developer" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  loginResident: (userId: number, plainPassword: string) => Promise<void>;
  loginOfficer: (officerEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");

        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.userRole); // assumes user has userRole
          api.setAuthToken(storedToken);

          console.log("🔐 Restored session:", {
            token: storedToken,
            user: parsed,
            role: parsed.userRole,
          });
        } else {
          // TODO: get session details here
          console.log("No stored auth found");
        }
      } catch (err) {
        console.error("⚠️ Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const loginResident = async (userId: number, password: string) => {
    console.log(userId, password);
    const res = await authAPI.loginResident({
      userId,
      password,
    });
    if (!res.accessToken || !res.refreshToken)
      throw new Error("Invalid login response");

    await AsyncStorage.setItem("token", res.accessToken);
    await AsyncStorage.setItem("user", JSON.stringify(res.user));

    api.setAuthToken(res.accessToken);
    setUser(res.user);
    setRole(res.user.userRole);
    console.log(res);
  };

  const loginOfficer = async (officerEmail: string, password: string) => {
    const res = await authAPI.loginOfficer({
      officerEmail,
      password,
    });
    if (!res.accessToken || !res.refreshToken)
      throw new Error("Invalid login response");

    await AsyncStorage.setItem("token", res.accessToken);
    await AsyncStorage.setItem("user", JSON.stringify(res.user));

    api.setAuthToken(res.accessToken);
    setUser(res.user);
    setRole(res.user.userRole);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    api.removeAuth();
    setUser(null);
    setRole(null);
  };

  const isAdmin = role === "officer" || role === "developer";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isAuthenticated,
        loading,
        loginResident,
        loginOfficer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
