import React from "react";
import { FlatList, ImageSourcePropType } from "react-native";
import CustomCard from "../CustomCard";

type Voucher = {
  id: string;
  taskName: string;
  taskCategory: string;
  taskCategoryId: string;
  taskDescription: string;
  points?: number;
  image?: ImageSourcePropType;
};

interface VoucherGridProps {
  data: Voucher[];
}

const VoucherGrid: React.FC<VoucherGridProps> = ({ data }) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={4}
      columnWrapperStyle={{
        justifyContent: "space-between",
        marginBottom: 20,
      }}
      renderItem={({ item }) => (
        <CustomCard
          title={item.taskName}
          points={item.points}
          image={item.image}
        />
      )}
    />
  );
};

export default VoucherGrid;
