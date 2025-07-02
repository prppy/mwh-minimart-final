// import React, { useState } from "react";
// import {
//   Box,
//   HStack,
//   VStack,
//   Heading,
//   Text,
//   Image,
//   Pressable,
//   Icon,
// } from "@gluestack-ui/themed";
// import { ImageBackground } from "react-native";

// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// // helper
// const hslToHSLA = (hsl, alpha) => {
//   return hsl.replace("hsl(", `hsla(`).replace(")", `, ${alpha})`);
// };

// const setHSLlightness = (hsl, newLightness) => {
//   const parts = hsl.split(",");
//   // parts[2] is lightness (" l% )"), so strip % and )
//   parts[2] = ` ${Math.max(0, Math.min(100, newLightness)).toFixed(1)}%)`;
//   return parts.join(",");
// };

// const Profile = () => {
//   // user details
//   const [name, setName] = useState("");
//   const [leaderboard, setLeaderboard] = useState(-1);
//   const [points, setPoints] = useState(0);
//   const [loading, setLoading] = useState(true);

//   // personalisation
//   const [colorTheme, setColorTheme] = useState("hsl(9, 67%, 50%)");
//   const [style, setStyle] = useState("🎮"); // start with nature emoji

//   const colorOptions = [
//     "hsl(9, 67%, 50%)", // red
//     "hsl(25, 100%, 50%)", // orange
//     "hsl(55, 67%, 50%)", // yellow
//     "hsl(101, 67%, 50%)", // green
//     "hsl(208, 79%, 50%)", // light blue
//     "hsl(2, 67%, 50%)", // purple
//     "hsl(223, 49%, 50%)", // dark blue
//   ];

//   const styleOptions = ["🌳", "🏀", "🎨", "🎮", "📖"];
//   const styleBgMappings = {
//     "🌳": require("../../assets/background/nature.png"),
//     "🏀": require("../..//assets/background/sports.png"),
//     "🎨": require("../../assets/background/art.png"),
//     "🎮": require("../../assets/background/games.png"),
//     "📖": require("../../assets/background/education.png"),
//   };

//   return (
//     <Box flex={1} bg={hslToHSLA(colorTheme, 0.5)}>
//       {/* Semi-transparent image layer */}
//       <Image
//         source={styleBgMappings[style]}
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           width: "100%",
//           height: "100%",
//           opacity: 0.55,
//         }}
//         resizeMode="cover"
//         alt={`${style} background wallpaper`}
//         onLoadStart={() => setLoading(true)}
//         onLoadEnd={() => setLoading(false)}
//       />
//       {loading && (
//         <Box
//           position="absolute"
//           top={0}
//           left={0}
//           right={0}
//           bottom={0}
//           justifyContent="center"
//           alignItems="center"
//           bg="transparent" // ensures background shows through
//           zIndex={10} // ensures loader is above the background
//         >
//           <ActivityIndicator size="large" color="#fff" />
//         </Box>
//       )}

//       {/* Content over both */}
//       <Box flex={1} p="$20">
//         <HStack space="2xl" alignItems="center" p="$4">
//           {/* profile pic */}
//           <Box
//             borderRadius="$full"
//             overflow="hidden"
//             borderWidth={5}
//             borderColor={colorTheme}
//             backgroundColor="white"
//           >
//             <Image
//               source={{ uri: "placeholder" }}
//               alt="Profile Picture"
//               width={300}
//               height={300}
//             />
//           </Box>

//           {/* details section */}
//           <VStack flex={1} space="lg" marginLeft={100}>
//             <Text
//               style={[styles.name, { color: setHSLlightness(colorTheme, 25) }]}
//             >
//               Resident Name
//             </Text>
//             <Text
//               style={[
//                 styles.detailsLabel,
//                 { color: setHSLlightness(colorTheme, 25) },
//               ]}
//             >
//               Leaderboard: {leaderboard}
//             </Text>
//             <Text
//               style={[
//                 styles.detailsLabel,
//                 { color: setHSLlightness(colorTheme, 25) },
//               ]}
//             >
//               Points: {points} pts
//             </Text>
//             <HStack space="lg">
//               <Selector title="Colour" colorTheme={colorTheme}>
//                 {colorOptions.map((color, index) => (
//                   <ColorSwatch
//                     key={index}
//                     color={color}
//                     selected={colorTheme === color}
//                     onPress={() => setColorTheme(color)}
//                   />
//                 ))}
//               </Selector>

//               <Selector title="Style" colorTheme={colorTheme}>
//                 {styleOptions.map((icon) => (
//                   <StyleIcon
//                     key={icon}
//                     icon={icon}
//                     selected={style === icon}
//                     onPress={() => setStyle(icon)}
//                   />
//                 ))}
//               </Selector>
//             </HStack>
//             <Box style={styles.selectorCard}>
//               <Text
//                 style={[
//                   styles.detailsLabel,
//                   { color: setHSLlightness(colorTheme, 25) },
//                 ]}
//               >
//                 Recent Transactions
//               </Text>
//             </Box>
//           </VStack>
//         </HStack>
//       </Box>
//     </Box>
//   );
// };

// export default Profile;

// const styles = {
//   name: {
//     fontWeight: "bold",
//     fontSize: 50,
//     // color: "white",
//   },
//   detailsLabel: {
//     fontWeight: "500",
//     fontSize: 30,
//     marginBottom: 5,
//     // color: "white",
//   },
//   selectorCard: {
//     borderRadius: 15,
//     backgroundColor: "white",
//     padding: 20,
//   },
// };
// // helper components

// const ColorSwatch = ({ color, selected, onPress }) => (
//   <Pressable
//     onPress={onPress}
//     style={{
//       width: 50,
//       height: 50,
//       borderRadius: "50%",
//       backgroundColor: color,
//       borderWidth: selected ? 3 : 1,
//       borderColor: selected ? "#D9E0F2" : "#ccc",
//     }}
//   />
// );

// const StyleIcon = ({ icon, selected, onPress }) => (
//   <Pressable
//     onPress={onPress}
//     style={{
//       width: 50,
//       height: 50,
//       borderRadius: 10,
//       justifyContent: "center",
//       alignItems: "center",
//       borderWidth: selected ? 3 : 1,
//       borderColor: selected ? "#131E39" : "#ccc",
//     }}
//   >
//     <Text fontSize={40}>{icon}</Text>
//   </Pressable>
// );

// const Selector = ({ title, children, colorTheme }) => (
//   <Box borderRadius="$md" bg="$white" style={styles.selectorCard} flex={1}>
//     <VStack space="sm">
//       <HStack alignItems="center" space="md">
//         <Text style={[styles.detailsLabel, { color: colorTheme }]}>
//           {title}
//         </Text>
//         {/* <Icon
//           as={MaterialCommunityIcons}
//           name="pencil"
//           size={30}
//           color={colorTheme || "$black"}
//         /> */}
//       </HStack>

//       <HStack space="lg" flexWrap="wrap">
//         {children}
//       </HStack>
//     </VStack>
//   </Box>
// );
