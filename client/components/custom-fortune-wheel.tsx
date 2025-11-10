import { useEffect, useMemo, useRef, useState } from "react";
import { Text, Animated, Easing } from "react-native";
import { Box } from "./ui/box";
import Svg, { Circle, G, Path, Text as RNSVGText } from "react-native-svg";

interface FortuneWheelProps {
  options: string[];
  colors: string[]; // tailwind-style color strings
  onSpinEnd: (winner: string) => void;
  isSpinning: boolean;
  size?: number;
}

const FortuneWheel: React.FC<FortuneWheelProps> = ({
  options,
  colors,
  onSpinEnd,
  isSpinning,
  size = 500,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentPointerName, setCurrentPointerName] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const currentSpinValue = useRef(0);

  const radius = size / 2;
  const center = radius;

  // --- segments ---
  const segments = useMemo(() => {
    // --- helper functions ---
    const createSegmentPath = (index: number, total: number) => {
      if (total === 1) {
        const r = radius - 20;
        return `M ${center} ${center} m -${r},0 a ${r},${r} 0 1,1 ${
          r * 2
        },0 a ${r},${r} 0 1,1 -${r * 2},0`;
      }

      const angle = ((360 / total) * Math.PI) / 180;
      const startAngle = index * angle;
      const endAngle = (index + 1) * angle;

      const x1 = center + Math.cos(startAngle) * (radius - 20);
      const y1 = center + Math.sin(startAngle) * (radius - 20);
      const x2 = center + Math.cos(endAngle) * (radius - 20);
      const y2 = center + Math.sin(endAngle) * (radius - 20);

      const largeArc = angle > Math.PI ? 1 : 0;

      return `M ${center} ${center} L ${x1} ${y1} A ${radius - 20} ${
        radius - 20
      } 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    const getTextPosition = (index: number, total: number) => {
      if (total === 1) return { x: center, y: center, rotation: 0 };

      const angle = ((360 / total) * Math.PI) / 180;
      const midAngle = (index + 0.5) * angle;
      const textRadius = radius * 0.7;

      const x = center + Math.cos(midAngle) * textRadius;
      const y = center + Math.sin(midAngle) * textRadius;
      const rotation = ((midAngle * 180) / Math.PI + 90) % 360;

      return { x, y, rotation };
    };

    return options.map((option, i) => ({
      option,
      path: createSegmentPath(i, options.length),
      textPos: getTextPosition(i, options.length),
    }));
  }, [center, options, radius]);

  // --- confetti particles ---
  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        animValue: new Animated.Value(0),
        x: Math.random() * size,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFEAA7",
          "#DDA0DD",
          "#F8C471",
        ][Math.floor(Math.random() * 6)],
        size: 8 + Math.random() * 8,
        delay: Math.random() * 500,
      })),
    [size]
  );

  // --- spin effect ---
  useEffect(() => {
    if (!isSpinning || options.length === 0) return;

    spinValue.setValue(0);
    arrowBounce.setValue(0);
    currentSpinValue.current = 0;

    const totalRotation = 360 * (3 + Math.random() * 4) + Math.random() * 360;
    const listenerId = spinValue.addListener(({ value }) => {
      currentSpinValue.current = value;
    });

    // arrow bounce
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, {
          toValue: 1,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounce, {
          toValue: -1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounce, {
          toValue: 0,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bounceAnimation.start();

    // spin animation
    Animated.timing(spinValue, {
      toValue: totalRotation,
      duration: 10000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      bounceAnimation.stop();
      spinValue.removeListener(listenerId);

      const finalAngle = totalRotation % 360;
      setCurrentRotation(finalAngle);

      const segmentAngle = 360 / options.length;
      const winnerIndex = Math.floor(
        ((360 - finalAngle + segmentAngle / 2) % 360) / segmentAngle
      );
      setCurrentPointerName(options[winnerIndex]);

      // show confetti
      setShowCelebration(true);
      confettiParticles.forEach((p) => {
        p.animValue.setValue(0);
        Animated.timing(p.animValue, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          delay: p.delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
      setTimeout(() => setShowCelebration(false), 3500);

      onSpinEnd(options[winnerIndex]);
    });

    return () => {
      spinValue.removeListener(listenerId);
      bounceAnimation.stop();
    };
  }, [
    arrowBounce,
    confettiParticles,
    isSpinning,
    onSpinEnd,
    options,
    spinValue,
  ]);

  const animatedStyle = {
    transform: [
      {
        rotate: spinValue.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };
  const arrowStyle = {
    transform: [
      {
        translateY: arrowBounce.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-10, 0, 10],
        }),
      },
    ],
  };

  if (options.length === 0)
    return (
      <Box className="w-full rounded-full justify-center items-center border-2 border-gray-300 border-dashed">
        <Text className="text-center">
          Select participants to see the wheel
        </Text>
      </Box>
    );

  return (
    <Box style={{ alignItems: "center", width: size, height: size }}>
      {/* confetti */}
      {showCelebration &&
        confettiParticles.map((p) => (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              transform: [
                {
                  translateY: p.animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, size + 100],
                  }),
                },
                {
                  rotate: p.animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${p.rotation * 3}deg`],
                  }),
                },
                {
                  scale: p.animValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 0.5],
                  }),
                },
              ],
              opacity: p.animValue.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
              zIndex: 5,
            }}
          />
        ))}

      {/* arrow */}
      <Animated.View
        style={[{ position: "absolute", top: -40, zIndex: 10 }, arrowStyle]}
      >
        <Svg width={60} height={60} viewBox="0 0 60 60">
          <Circle cx={30} cy={32} r={22} fill="rgba(255,107,53,0.2)" />
          <Circle cx={30} cy={32} r={18} fill="rgba(255,107,53,0.3)" />
          <Path d="M30 50 L20 30 L30 35 L40 30 Z" fill="rgba(0,0,0,0.3)" />
          <Path
            d="M30 48 L18 28 L30 33 L42 28 Z"
            fill="#FF6B35"
            stroke="#FFF"
            strokeWidth={3}
          />
          <Path d="M30 33 L24 30 L30 40 Z" fill="#FF8C5A" />
          <Circle cx={30} cy={48} r={3} fill="#FF4500" />
        </Svg>
      </Animated.View>

      {/* wheel */}
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size}>
          {segments.map((s, i) => (
            <G key={i}>
              <Path d={s.path} fill={colors[i]} stroke="#fff" strokeWidth={2} />
              <RNSVGText
                x={s.textPos.x}
                y={s.textPos.y}
                fill="#000"
                fontSize={12}
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${
                  s.textPos.rotation > 180
                    ? s.textPos.rotation + 180
                    : s.textPos.rotation
                }, ${s.textPos.x}, ${s.textPos.y})`}
              >
                {s.option.length > 10 ? s.option.slice(0, 8) + "..." : s.option}
              </RNSVGText>
            </G>
          ))}
        </Svg>
      </Animated.View>
    </Box>
  );
};

export default FortuneWheel;
