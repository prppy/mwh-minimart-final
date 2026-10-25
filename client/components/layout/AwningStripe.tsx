import { View } from "react-native";

const ORANGE = "#e8502a";
const STRIPE = 28;
const COUNT = 120; // enough stripes for a 3360px wide screen

// The minimart's orange-and-white shop awning, as a scalloped band under the header
const AwningStripe: React.FC<{ height?: number }> = ({ height = 12 }) => (
  <View
    style={{ height, flexDirection: "row", overflow: "hidden" }}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {Array.from({ length: COUNT }, (_, i) => (
      <View
        key={i}
        style={{
          width: STRIPE,
          backgroundColor: i % 2 === 0 ? ORANGE : "#ffffff",
          borderBottomLeftRadius: STRIPE / 2,
          borderBottomRightRadius: STRIPE / 2,
        }}
      />
    ))}
  </View>
);

export default AwningStripe;
