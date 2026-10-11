import React from "react";
import { Platform, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import * as select from "@/components/ui/select";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  accessibilityLabel?: string;
  /** Red border (validation error) */
  invalid?: boolean;
  /** Smaller variant for catalogue cards */
  compact?: boolean;
}

const BLUE = "#1f3a93";

/**
 * Dropdown that renders a native <select> on web (matching the login design)
 * and Gluestack's bottom-sheet select on iOS/Android.
 */
const DropdownSelect: React.FC<DropdownSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  accessibilityLabel,
  invalid = false,
  compact = false,
}) => {
  const borderColor = invalid ? "#e8502a" : "#d9deeb";

  if (Platform.OS === "web") {
    return (
      <View style={{ position: "relative", flexDirection: "row" }}>
        <select
          value={value}
          aria-label={accessibilityLabel || placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: compact ? 14 : 16,
            fontWeight: 600,
            padding: compact ? "8px 36px 8px 12px" : "14px 44px 14px 16px",
            borderRadius: compact ? 10 : 12,
            border: `1.5px solid ${borderColor}`,
            outline: "none",
            background: "#fbfcfe",
            color: value ? "#1c2340" : "#9aa1b5",
          }}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} style={{ color: "#1c2340" }}>
              {option.label}
            </option>
          ))}
        </select>
        {/* chevron, as in the design */}
        <span
          style={{
            position: "absolute",
            right: compact ? 14 : 18,
            top: "50%",
            width: compact ? 7 : 9,
            height: compact ? 7 : 9,
            borderRight: `2.5px solid ${BLUE}`,
            borderBottom: `2.5px solid ${BLUE}`,
            transform: "translateY(-70%) rotate(45deg)",
            pointerEvents: "none",
          }}
        />
      </View>
    );
  }

  const selected = options.find((o) => o.value === value);
  return (
    <select.Select
      selectedValue={value}
      initialLabel={selected?.label}
      onValueChange={onChange}
      accessibilityLabel={accessibilityLabel || placeholder}
    >
      <select.SelectTrigger
        style={{
          borderWidth: 1.5,
          borderColor,
          borderRadius: compact ? 10 : 12,
          backgroundColor: "#fbfcfe",
          height: compact ? 40 : 52,
        }}
      >
        <select.SelectInput placeholder={placeholder} className="flex-1" />
        <select.SelectIcon className="mr-3" as={ChevronDown} />
      </select.SelectTrigger>
      <select.SelectPortal>
        <select.SelectBackdrop />
        <select.SelectContent>
          <select.SelectDragIndicatorWrapper>
            <select.SelectDragIndicator />
          </select.SelectDragIndicatorWrapper>
          {options.map((option) => (
            <select.SelectItem key={option.value} label={option.label} value={option.value} />
          ))}
        </select.SelectContent>
      </select.SelectPortal>
    </select.Select>
  );
};

export default DropdownSelect;
