import React, { useEffect, useId, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import api, { ApiError } from "@/utils/api";
import { useAuth } from "@/contexts/auth-context";
import { MINIMART_DISCLAIMER } from "@/constants/policy";
import BrandLogo from "@/components/brand-logo";
import DropdownSelect from "@/components/dropdown-select";

// Layout and copy from "Minimart Login.dc.html"
const SCENE = require("@/assets/redeem-scene.webp");

const BLUE = "#1f3a93";
const ORANGE = "#e8502a";
const INK = "#1c2340";
const MUTED = "#5a6178";
const FIELD_BORDER = "#d9deeb";
const FIELD_BG = "#fbfcfe";

type Role = "resident" | "staff";

interface ResidentOption {
  id: number;
  userName: string;
}

// The scene image is 1840×2360. The design uses background-size: cover with
// background-position: 62% 100%, i.e. keep the children at the counter in view.
const SCENE_WIDTH = 1840;
const SCENE_HEIGHT = 2360;

const SceneImage: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const scale = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT);
  const w = SCENE_WIDTH * scale;
  const h = SCENE_HEIGHT * scale;
  return (
    <Image
      source={SCENE}
      accessibilityLabel="Residents redeeming a voucher at the minimart counter"
      style={{
        position: "absolute",
        width: w,
        height: h,
        left: (width - w) * 0.62,
        top: height - h,
      }}
    />
  );
};

// Striped awning along the top of the illustration panel
const Awning: React.FC = () => (
  <View
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 30,
      flexDirection: "row",
      overflow: "hidden",
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 6 },
    }}
  >
    {Array.from({ length: 30 }, (_, i) => (
      <View key={i} style={{ width: 44, backgroundColor: i % 2 === 0 ? ORANGE : "#ffffff" }} />
    ))}
  </View>
);

const SceneCaption: React.FC<{ inset: number }> = ({ inset }) => (
  <View style={{ paddingHorizontal: inset, paddingBottom: 28, gap: 8 }}>
    <Text style={{ color: "#000000", fontSize: 28, lineHeight: 31, fontWeight: "900", letterSpacing: -0.7 }}>
      Every good deed counts.
    </Text>
    <Text style={{ color: INK, fontSize: 14, lineHeight: 21, fontWeight: "600", maxWidth: 360 }}>
      Earn points by helping out, then redeem them for treats at the minimart counter.
    </Text>
  </View>
);

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { loginResident, loginOfficer } = useAuth();
  const { width } = useWindowDimensions();
  const twoColumns = width >= 760;

  const [role, setRole] = useState<Role>("resident");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [residentsError, setResidentsError] = useState("");
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  // Unique gradient id: an earlier, hidden visit to this page stays mounted, and
  // url(#id) would otherwise point at its gradient, which never paints
  const fadeId = `fade${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const isResident = role === "resident";

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("users", {
          params: { role: "resident", includeProfilePicture: "false", limit: 1000 },
        });
        const users: ResidentOption[] = (res.data.data?.users || []).filter(
          (u: any) => u.resident?.isActive !== false
        );
        setResidents(users);
      } catch (err) {
        console.error("Failed to load residents:", err);
        setResidentsError("Could not load the resident list. Please refresh the page.");
      }
    })();
  }, []);

  const residentOptions = useMemo(
    () => residents.map((r) => ({ label: r.userName, value: String(r.id) })),
    [residents]
  );

  const pickRole = (next: Role) => {
    setRole(next);
    setUserId("");
    setError("");
    setTouched(false);
  };

  const forgot = () =>
    setError(
      isResident
        ? "Please ask a staff member to reset your password."
        : "Please contact the minimart administrator to reset your password."
    );

  const submit = async () => {
    if (!userId.trim() || !password.trim()) {
      setTouched(true);
      setError(
        isResident ? "Please select your name and enter your password." : "Please fill in both fields."
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (isResident) {
        await loginResident(parseInt(userId), password, remember);
        router.replace("/(resident)/profile");
      } else {
        await loginOfficer(userId.trim(), password, remember);
        router.replace("/(admin)");
      }
      setPassword("");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 401
          ? "Incorrect password. Please try again."
          : status === 404 || status === 400
            ? isResident
              ? "We couldn't log you in. Please ask a staff member for help."
              : "We couldn't find a staff account with that email."
            : "Login failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = (v: string) => (touched && !v.trim() ? ORANGE : FIELD_BORDER);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f2f4f9" }}
      contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1040,
          backgroundColor: "#ffffff",
          borderRadius: 28,
          overflow: "hidden",
          flexDirection: twoColumns ? "row" : "column",
          shadowColor: BLUE,
          shadowOpacity: 0.12,
          shadowRadius: 60,
          shadowOffset: { width: 0, height: 24 },
          elevation: 8,
        }}
      >
        {/* Illustration panel */}
        <View style={{ flex: twoColumns ? 1 : undefined, backgroundColor: "#f4f6fb" }}>
          <View
            onLayout={(e) => setPanelSize(e.nativeEvent.layout)}
            style={{
              flex: twoColumns ? 1 : undefined,
              minHeight: twoColumns ? 480 : 320,
              justifyContent: "flex-end",
              overflow: "hidden",
            }}
          >
            {panelSize.width > 0 && <SceneImage width={panelSize.width} height={panelSize.height} />}
            <Awning />
            {/* Two columns: black text on a white fade over the picture */}
            {twoColumns && (
              <>
                <Svg style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} width="100%" height="42%">
                  <Defs>
                    <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                      <Stop offset="0.42" stopColor="#ffffff" stopOpacity={0.92} />
                      <Stop offset="1" stopColor="#ffffff" stopOpacity={1} />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill={`url(#${fadeId})`} />
                </Svg>
                <SceneCaption inset={40} />
              </>
            )}
          </View>
          {/* One column: the text goes under the picture so it never covers the children */}
          {!twoColumns && (
            <View style={{ backgroundColor: "#ffffff", paddingTop: 24 }}>
              <SceneCaption inset={24} />
            </View>
          )}
        </View>

        {/* Form panel */}
        <View
          style={{
            flex: twoColumns ? 1 : undefined,
            paddingVertical: 28,
            paddingHorizontal: twoColumns ? 48 : 24,
            justifyContent: "center",
            gap: 16,
          }}
        >
          <View style={{ alignItems: "center", gap: 8 }}>
            <BrandLogo width={Math.min(280, width - 96)} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
              <Text style={{ color: BLUE, fontSize: 13, fontWeight: "900" }}>Do Good.</Text>
              <Text style={{ color: ORANGE, fontSize: 13, fontWeight: "900" }}>Earn Points.</Text>
              <Text style={{ color: BLUE, fontSize: 13, fontWeight: "900" }}>Get Rewarded.</Text>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: BLUE, letterSpacing: -0.3 }}>Welcome back</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: MUTED }}>
              Log in to shop, check your points and redeem rewards.
            </Text>
          </View>

          {/* Resident / Staff toggle */}
          <View style={{ flexDirection: "row", backgroundColor: "#eef1f7", borderRadius: 14, padding: 5, gap: 4 }}>
            {(["resident", "staff"] as Role[]).map((r) => {
              const on = role === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => pickRole(r)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: on ? "#ffffff" : "transparent",
                    shadowColor: BLUE,
                    shadowOpacity: on ? 0.12 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: on ? BLUE : MUTED }}>
                    {r === "resident" ? "Resident" : "Staff"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: INK }}>
                {isResident ? "Resident" : "Staff email"}
              </Text>
              {isResident ? (
                <DropdownSelect
                  value={userId}
                  onChange={(v) => {
                    setUserId(v);
                    setError("");
                  }}
                  options={residentOptions}
                  placeholder="Select your name"
                  accessibilityLabel="Resident"
                  invalid={touched && !userId}
                />
              ) : (
                <TextInput
                  value={userId}
                  onChangeText={(v) => {
                    setUserId(v);
                    setError("");
                  }}
                  placeholder="name@mwh.org.sg"
                  placeholderTextColor="#9aa1b5"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    height: 46, // same as the resident dropdown, so switching tabs never resizes the card
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: fieldBorder(userId),
                    backgroundColor: FIELD_BG,
                    color: INK,
                  }}
                />
              )}
              {isResident && residentsError ? (
                <Text style={{ fontSize: 13, color: "#c43d1b" }}>{residentsError}</Text>
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: INK }}>Password</Text>
                <Pressable onPress={forgot}>
                  {({ hovered }: any) => (
                    <Text style={{ fontSize: 13, fontWeight: "700", color: hovered ? ORANGE : BLUE }}>
                      Forgot password?
                    </Text>
                  )}
                </Pressable>
              </View>
              <View style={{ position: "relative", justifyContent: "center" }}>
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  onSubmitEditing={submit}
                  secureTextEntry={!showPw}
                  placeholder="Enter your password"
                  placeholderTextColor="#9aa1b5"
                  autoComplete="password"
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    height: 46,
                    paddingLeft: 16,
                    paddingRight: 72,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: fieldBorder(password),
                    backgroundColor: FIELD_BG,
                    color: INK,
                  }}
                />
                <Pressable
                  onPress={() => setShowPw((s) => !s)}
                  style={{ position: "absolute", right: 8, paddingVertical: 8, paddingHorizontal: 10 }}
                  accessibilityLabel={showPw ? "Hide password" : "Show password"}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: BLUE }}>{showPw ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={{ backgroundColor: "#fdeee9", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#c43d1b" }}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => setRemember((r) => !r)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: BLUE,
                  backgroundColor: remember ? BLUE : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {remember && <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900", lineHeight: 14 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: MUTED }}>Keep me logged in</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              disabled={loading}
              style={({ hovered, pressed }: any) => ({
                backgroundColor: hovered || pressed ? ORANGE : BLUE,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                opacity: loading ? 0.8 : 1,
                shadowColor: hovered || pressed ? ORANGE : BLUE,
                shadowOpacity: 0.25,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#ffffff" }}>
                {loading ? "Logging in…" : "Log in"}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: MUTED, textAlign: "center", lineHeight: 18, minHeight: 36 }}>
              {isResident
                ? "New here? Ask a staff member to set up your account."
                : "Need access? Contact the minimart administrator."}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#8a90a4", textAlign: "center" }}>
              {MINIMART_DISCLAIMER}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginPage;
