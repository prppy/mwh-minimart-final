import { Search, X } from "lucide-react-native";
import { Input, InputField, InputIcon, InputSlot } from "./ui/input";
import { Pressable } from "./ui/pressable";

interface SearchBarProps {
  search: string;
  setSearch: (s: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ search, setSearch }) => {
  return (
    <Input className="flex-1 bg-white" variant="rounded" size="lg">
      <InputSlot className="pl-3">
        <InputIcon as={Search} className="text-indigoscale-500" />
      </InputSlot>
      <InputField
        className="text-indigoscale-500"
        type="text"
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
      />
      {search.length > 0 && (
        <InputSlot>
          <Pressable onPress={() => setSearch("")}>
            <InputIcon as={X} className="px-5 text-indigoscale-500" />
          </Pressable>
        </InputSlot>
      )}
    </Input>
  );
};

export default SearchBar;
