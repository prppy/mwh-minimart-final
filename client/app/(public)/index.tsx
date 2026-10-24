import React, { useState } from "react";
import { Image, LayoutChangeEvent, ScrollView, Text, useWindowDimensions, View } from "react-native";

import BrandLogo from "@/components/brand-logo";
import Footer from "@/components/layout/Footer";

// Layout from "Minimart Landing.dc.html": the hero illustration has its own
// title text, which is covered by soft panels with the MWH logo and tagline
// on top. All positions are fractions of the hero image (1150 × 762).
const HERO = require("@/assets/hero.png");
const HERO_ASPECT = 1150 / 762;
// Cover the screen only while the sides lose at most ~10% each; narrower
// (portrait) screens show the whole image instead, so the logo is never cut
const MIN_COVER_ASPECT = 1.2;

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
  const window = useWindowDimensions();
  // The area below the header, measured on layout
  const [viewport, setViewport] = useState({ width: window.width, height: window.height });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== viewport.width || height !== viewport.height) setViewport({ width, height });
  };

  // Fill the whole viewport: full width, and at least the full height
  const boxWidth = viewport.width;
  const fitHeight = boxWidth / HERO_ASPECT;
  const cover = fitHeight < viewport.height && boxWidth / viewport.height >= MIN_COVER_ASPECT;
  const boxHeight = Math.max(fitHeight, viewport.height);

  // Image size and offset inside the box (centred, cropping the sides when covering)
  const imageHeight = cover ? boxHeight : fitHeight;
  const imageWidth = imageHeight * HERO_ASPECT;
  const imageLeft = (boxWidth - imageWidth) / 2;
  const imageTop = (boxHeight - imageHeight) / 2;
  const cq = imageWidth / 100; // 1 "cqw" from the design

  const logoWidth = 0.47 * imageWidth * 0.92;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PANEL }} onLayout={onLayout}>
      <View style={{ width: boxWidth, height: boxHeight, overflow: "hidden", backgroundColor: PANEL }}>
        <View
          style={{
            position: "absolute",
            left: imageLeft,
            top: imageTop,
            width: imageWidth,
            height: imageHeight,
          }}
        >
          <Image
            source={HERO}
            accessibilityLabel="Minimart illustration"
            style={{ position: "absolute", left: 0, top: 0, width: imageWidth, height: imageHeight }}
            resizeMode="stretch"
          />

          {PANELS.map((p, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: p.left * imageWidth,
                top: p.top * imageHeight,
                width: p.width * imageWidth,
                height: p.height * imageHeight,
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
              left: 0.31 * imageWidth,
              top: 0.075 * imageHeight,
              width: 0.47 * imageWidth,
              alignItems: "center",
            }}
          >
            <BrandLogo width={logoWidth} style={{ marginTop: 2 * cq }} />
          </View>

          {/* Tagline: one line, centred under the logo (white-space: nowrap in the design) */}
          <View
            style={{
              position: "absolute",
              left: 0.245 * imageWidth,
              width: 0.6 * imageWidth,
              top: 0.075 * imageHeight + 2 * cq + logoWidth / (470 / 120) + 1.4 * cq,
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
      </View>

      <Footer />
    </ScrollView>
  );
};

export default PublicLandingPage;
