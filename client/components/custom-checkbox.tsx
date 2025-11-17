import { Check } from "lucide-react-native";
import * as checkbox from "@/components/ui/checkbox";

interface CustomCheckboxProps {
  value: string;
  children: React.ReactNode;
}

const Checkbox = ({ value, children }: CustomCheckboxProps) => {
  return (
    <checkbox.Checkbox value={value}>
      <checkbox.CheckboxIndicator className="border-indigoscale-700 data-[checked=true]:bg-indigoscale-700">
        <checkbox.CheckboxIcon as={Check} />
      </checkbox.CheckboxIndicator>
      <checkbox.CheckboxLabel
        className="
          text-indigoscale-700
          data-[checked=true]:text-indigoscale-700
          data-[hover=true]:text-indigoscale-900
          data-[active=true]:text-indigoscale-900
          data-[disabled=true]:opacity-40
        "
      >
        {children}
      </checkbox.CheckboxLabel>
    </checkbox.Checkbox>
  );
};

export default Checkbox;
