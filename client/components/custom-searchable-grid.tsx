import { useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Plus } from "lucide-react-native";
import { Button, ButtonText } from "./ui/button";
import { Card } from "./ui/card";
import { Center } from "./ui/center";
import { Grid, GridItem } from "./ui/grid";
import { HStack } from "./ui/hstack";
import { Image } from "./ui/image";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";
import { useAuth } from "@/contexts/auth-context";
import EmptyAlert from "./custom-empty-alert";
import SearchBar from "./custom-searchbar";

interface SearchableGridProps {
  items: {
    id: number | string;
    name: string;
    points: number;
    image: string;
  }[];
  onItemPress: (item: {
    id: number | string;
    name: string;
    points: number;
    image: string;
  }) => void;
  onAddPress: () => void;
  noItemsAlert: string;
}

const SearchableGrid: React.FC<SearchableGridProps> = ({
  items,
  onItemPress,
  onAddPress,
  noItemsAlert,
}) => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) =>
      sortOrder === "asc" ? a.points - b.points : b.points - a.points
    );
  }, [items, search, sortOrder]);

  return (
    <VStack className="flex-1 gap-5" space="md">
      <HStack className="w-full justify-between gap-5">
        {/* search bar */}
        <SearchBar search={search} setSearch={setSearch} />

        {/* point ordering */}
        <Button
          action="secondary"
          className={sortOrder === "asc" ? "bg-indigoscale-700" : ""}
          onPress={() => setSortOrder("asc")}
        >
          <ButtonText
            className={
              sortOrder === "asc" ? "text-white" : "text-indigoscale-700"
            }
          >
            Points Ascending
          </ButtonText>
        </Button>
        <Button
          action="secondary"
          className={sortOrder === "desc" ? "bg-indigoscale-700" : ""}
          onPress={() => setSortOrder("desc")}
        >
          <ButtonText
            className={
              sortOrder === "desc" ? "text-white" : "text-indigoscale-700"
            }
          >
            Points Descending
          </ButtonText>
        </Button>
      </HStack>

      {/* grid */}
      {visibleItems.length === 0 ? (
        <EmptyAlert text={noItemsAlert} />
      ) : (
        <ScrollView>
          <Grid className="gap-5" _extra={{ className: "grid-cols-2" }}>
            {isAuthenticated && isAdmin && (
              <GridItem _extra={{ className: "col-span-1" }}>
                <Pressable onPress={onAddPress}>
                  <Card className="bg-white" size="md" variant="outline">
                    <Center className="w-full h-64 bg-indigoscale-300 rounded-md mb-5">
                      <Plus
                        size={48}
                        strokeWidth={2}
                        className="text-indigoscale-700"
                      />
                    </Center>
                    <Text
                      size="xl"
                      className="text-indigoscale-700"
                      numberOfLines={1}
                    >
                      Add New Item
                    </Text>
                    <Text></Text>
                  </Card>
                </Pressable>
              </GridItem>
            )}
            {visibleItems.map((item) => (
              <GridItem key={item.id} _extra={{ className: "col-span-1" }}>
                <Pressable onPress={() => onItemPress(item)}>
                  <Card className="bg-white" size="md" variant="outline">
                    <Center className="w-full h-64 bg-indigoscale-300 rounded-md mb-5">
                      <Image
                        source={item.image}
                        alt={item.name}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    </Center>
                    <Text
                      size="xl"
                      className="text-indigoscale-700"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text bold className="text-gray-500">
                      {item.points} pts
                    </Text>
                  </Card>
                </Pressable>
              </GridItem>
            ))}
            {/* filler if odd to prevent weird ui */}
            {visibleItems.length % 2 !== 0 && (
              <GridItem _extra={{ className: "col-span-1" }}></GridItem>
            )}
          </Grid>
        </ScrollView>
      )}
    </VStack>
  );
};

export default SearchableGrid;
