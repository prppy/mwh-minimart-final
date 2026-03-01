import React from "react";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";

interface RowsPerPageSelectorProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
}

const RowsPerPageSelector: React.FC<RowsPerPageSelectorProps> = ({
  value,
  options,
  onChange,
}) => {
  return (
    <Select
      selectedValue={value.toString()}
      onValueChange={(itemValue) => onChange(parseInt(itemValue))}
    >
      <SelectTrigger variant="outline" size="sm" >
        <SelectInput
          placeholder={`${value}`} // dynamic placeholder
        />
        <SelectIcon as={ChevronDownIcon} color="$black" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option}
              label={option.toString()}
              value={option.toString()}
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

export default RowsPerPageSelector;
