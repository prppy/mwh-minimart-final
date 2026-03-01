import * as ImagePicker from "expo-image-picker";

export const pickImage = async (onPicked: (uri: string) => void) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      // use callback to save or send to backend
      onPicked(uri);
    }
  } catch (err) {
    console.error("Image picking failed:", err);
  }
};
