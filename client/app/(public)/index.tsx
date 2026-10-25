import React, { useId, useState } from "react";
import { Image, LayoutChangeEvent, Text, useWindowDimensions, View } from "react-native";

import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import BrandLogo from "@/components/brand-logo";
import Footer from "@/components/layout/Footer";

// Layout from "Minimart Landing.dc.html": the hero illustration has its own
// title text, which is covered by soft panels with the MWH logo and tagline
// on top. All positions are fractions of the hero image (2300 × 1524).
const HERO = require("@/assets/hero.webp");
const HERO_ASPECT = 2300 / 1524;
// The page never scrolls: the image is fitted to the space above the footer.
// It may lose up to ~10% of each side to fill more of the height; the logo and
// tagline sit in the middle, so they are never cut.
const MAX_SIDE_CROP = 0.1;
// Fraction of the image height: the blank space runs from the logo (~0.27) to
// the children's heads (~0.5); it sits just below the cart bubble on the left (~0.41)
const TAGLINE_TOP = 0.425;

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
  // Unique gradient id (see login.tsx): a hidden earlier visit would otherwise own "edges"
  const edgesId = `edges${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== viewport.width || height !== viewport.height) setViewport({ width, height });
  };

  // Largest image that fits the box, allowing the sides to be cropped a little
  const boxWidth = viewport.width;
  const boxHeight = viewport.height;
  const imageWidth = Math.min(boxHeight * HERO_ASPECT, boxWidth / (1 - 2 * MAX_SIDE_CROP));
  const imageHeight = imageWidth / HERO_ASPECT;
  const imageLeft = (boxWidth - imageWidth) / 2;
  const imageTop = (boxHeight - imageHeight) / 2;
  const cq = imageWidth / 100; // 1 "cqw" from the design

  const logoWidth = 0.47 * imageWidth * 0.92;

  return (
    <View style={{ flex: 1, backgroundColor: PANEL }}>
      <View style={{ flex: 1, overflow: "hidden", backgroundColor: PANEL }} onLayout={onLayout}>
        {/* Wide screens: a blurred copy fills the space beside the illustration */}
        {imageWidth < boxWidth && (
          <>
            <Image
              source={HERO}
              blurRadius={40}
              resizeMode="cover"
              style={{ position: "absolute", left: 0, top: 0, width: boxWidth, height: boxHeight, opacity: 0.55 }}
            />
            {/* Soften the illustration's left and right edges into the blur */}
            <Svg
              style={{ position: "absolute", left: imageLeft, top: imageTop, zIndex: 1 }}
              width={imageWidth}
              height={imageHeight}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient id={edgesId} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={PANEL} stopOpacity={0.9} />
                  <Stop offset="0.05" stopColor={PANEL} stopOpacity={0} />
                  <Stop offset="0.95" stopColor={PANEL} stopOpacity={0} />
                  <Stop offset="1" stopColor={PANEL} stopOpacity={0.9} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${edgesId})`} />
            </Svg>
          </>
        )}
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

          {/* Tagline: one line, centred under the logo, in the middle of the blank
              space between the logo and the children */}
          <View
            style={{
              position: "absolute",
              left: 0.245 * imageWidth,
              width: 0.6 * imageWidth,
              top: TAGLINE_TOP * imageHeight,
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
    </View>
  );
};

export default PublicLandingPage;
