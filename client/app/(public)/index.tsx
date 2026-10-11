import React from "react";
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/contexts/auth-context";
import BrandLogo from "@/components/brand-logo";
import Footer from "@/components/layout/Footer";

// Layout from "Minimart Landing.dc.html": the hero illustration has its own
// title text, which is covered by soft panels with the MWH logo and tagline
// on top. All positions are fractions of the hero box (1150 × 762).
const HERO = require("@/assets/hero.png");
const HERO_MAX_WIDTH = 1150;
const HERO_ASPECT = 1150 / 762;

const BLUE = "#1f3a93";
const ORANGE = "#e8502a";
const PANEL = "#f8f9fc";

// Patches that hide the illustration's built-in title text
const PANELS = [
  { left: 0.315, top: 0.09, width: 0.465, height: 0.21 },
  { left: 0.36, top: 0.29, width: 0.42, height: 0.18 },
  { left: 0.41, top: 0.44, width: 0.32, height: 0.12 },
];

const PublicLandingPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const { width } = useWindowDimensions();

  const heroWidth = Math.min(width, HERO_MAX_WIDTH);
  const heroHeight = heroWidth / HERO_ASPECT;
  const cq = heroWidth / 100; // 1 "cqw" from the design

  const cta = isAuthenticated
    ? { label: "Browse the catalogue", onPress: () => router.push("/(public)/catalogue") }
    : { label: "Log in to redeem your points now", onPress: () => router.push("/login") };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#eef1f7" }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ width: heroWidth, alignSelf: "center" }}>
        <View
          style={{
            width: heroWidth,
            height: heroHeight,
            overflow: "hidden",
            backgroundColor: PANEL,
          }}
        >
          <Image
            source={HERO}
            accessibilityLabel="Minimart illustration"
            style={{ position: "absolute", left: 0, top: 0, width: heroWidth, height: heroHeight }}
            resizeMode="stretch"
          />

          {PANELS.map((p, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: p.left * heroWidth,
                top: p.top * heroHeight,
                width: p.width * heroWidth,
                height: p.height * heroHeight,
                backgroundColor: PANEL,
                borderRadius: 2 * cq,
                // Soft edge so the patch blends into the illustration
                shadowColor: PANEL,
                shadowOpacity: 1,
                // RN shadows have no "spread", so use a wider blur than the design's 1.6cqw
                shadowRadius: 3 * cq,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          ))}

          <View
            style={{
              position: "absolute",
              left: 0.31 * heroWidth,
              top: 0.075 * heroHeight,
              width: 0.47 * heroWidth,
              alignItems: "center",
            }}
          >
            <BrandLogo width={0.47 * heroWidth * 0.92} style={{ marginTop: 2 * cq }} />
          </View>

          {/* Tagline: one line, centred under the logo (white-space: nowrap in the design) */}
          <View
            style={{
              position: "absolute",
              left: 0.245 * heroWidth,
              width: 0.6 * heroWidth,
              top: 0.075 * heroHeight + 2 * cq + (0.47 * heroWidth * 0.92) / (470 / 120) + 1.4 * cq,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "900", fontSize: 2.5 * cq, textAlign: "center" }}>
              <Text style={{ color: BLUE }}>Do Good.</Text>
              <Text style={{ color: ORANGE }}>{"  "}Earn Points.</Text>
              <Text style={{ color: BLUE }}>{"  "}Get Rewarded.</Text>
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 }}>
          <Pressable
            onPress={cta.onPress}
            style={({ hovered, pressed }: any) => ({
              backgroundColor: hovered || pressed ? ORANGE : BLUE,
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: 14,
              shadowColor: hovered || pressed ? ORANGE : BLUE,
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            })}
          >
            <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 17 }}>{cta.label}</Text>
          </Pressable>
          {isAuthenticated && role === "resident" && (
            <Pressable onPress={() => router.push("/(resident)/my-orders")} style={{ marginTop: 12 }}>
              <Text style={{ color: BLUE, fontWeight: "800", fontSize: 15 }}>View my orders</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <Footer />
    </ScrollView>
  );
};

export default PublicLandingPage;
