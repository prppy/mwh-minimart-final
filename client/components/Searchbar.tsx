import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@gluestack-ui/themed";
import { Search } from "lucide-react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || "Search..."}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
      />
      <Icon as={Search} color="#999" size="md" style={styles.icon} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginTop: 20,
  },
  searchInput: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    paddingRight: 40, // space for icon
  },
  icon: {
    position: "absolute",
    right: 12,
    top: 14,
  },
});

export default SearchBar;
