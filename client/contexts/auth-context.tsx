import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { authAPI, User } from "../utils/auth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

type Role = "resident" | "admin" | "superadmin" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  loginResident: (userId: number, plainPassword: string) => Promise<void>;
  loginAdmin: (officerEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_AUTO_LOGOUT_MS = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "refreshToken", "user", "@cart"]); // Clear cart on logout
    api.removeAuth();
    setUser(null);
    setRole(null);
  };

  // Auto logout after inactivity (applies to all authenticated users)
  const { resetTimer } = useIdleTimeout({
    timeout: INACTIVITY_AUTO_LOGOUT_MS,
    onIdle: () => {
      if (user) {
        void logout();
      }
    },
    onActive: () => {
      // no-op
    },
  });

  // Whenever auth state changes, reset inactivity timer for logged-in users.
  useEffect(() => {
    if (user) {
      resetTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedUser, storedToken, storedRefreshToken] =
          await AsyncStorage.multiGet(["user", "token", "refreshToken"]).then(
            (entries) => entries.map(([, value]) => value)
          );

        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);

          // Exchange the refresh token for a fresh access token so restored
          // sessions don't silently expire mid-use.
          let activeToken = storedToken;
          if (storedRefreshToken) {
            try {
              const refreshed = await authAPI.refresh(storedRefreshToken);
              if (refreshed.accessToken) {
                activeToken = refreshed.accessToken;
                await AsyncStorage.setItem("token", activeToken);
              }
            } catch {
              // Refresh failed (expired/revoked): drop the stale session.
              await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
              return;
            }
          }

          setUser(parsed);
          setRole(parsed.userRole); // assumes user has userRole
          api.setAuthToken(activeToken);

          // Start counting inactivity as soon as a session is restored.
          resetTimer();
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storeSession = async (res: Awaited<ReturnType<typeof authAPI.loginResident>>) => {
    if (!res.accessToken || !res.refreshToken)
      throw new Error("Invalid login response");

    await AsyncStorage.multiSet([
      ["token", res.accessToken],
      ["refreshToken", res.refreshToken],
      ["user", JSON.stringify(res.user)],
    ]);

    api.setAuthToken(res.accessToken);
    setUser(res.user);
    setRole(res.user.userRole);

    // Start inactivity timer immediately after login.
    resetTimer();
  };

  const loginResident = async (userId: number, password: string) => {
    const res = await authAPI.loginResident({ userId, password });
    await storeSession(res);
  };

  const loginAdmin = async (officerEmail: string, password: string) => {
    const res = await authAPI.loginAdmin({ officerEmail, password });
    await storeSession(res);
  };

  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isSuperAdmin,
        isAuthenticated,
        loading,
        loginResident,
        loginAdmin,
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
