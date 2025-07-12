import React from "react";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectItem,
  ChevronDownIcon,
} from "@gluestack-ui/themed";

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
      <SelectTrigger variant="outline" size="sm" w="$16">
        <SelectInput
          placeholder={`${value}`} // dynamic placeholder
          color="$black"
        />
        <SelectIcon mr="$2" as={ChevronDownIcon} color="$black" />
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
