import { TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, onPrev, onNext, onPage }: PaginationProps) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end   = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <HStack className="items-center justify-center gap-1 py-4">
      <TouchableOpacity
        onPress={onPrev}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: "#F1EFE8", opacity: page === 1 ? 0.4 : 1 }}
      >
        <Icon as={ChevronLeft} size="xs" className="text-typography-600" />
      </TouchableOpacity>

      {start > 1 && (
        <>
          <TouchableOpacity
            onPress={() => onPage(1)}
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: "#F1EFE8" }}
          >
            <Text className="text-xs text-typography-600">1</Text>
          </TouchableOpacity>
          {start > 2 && <Text className="text-xs text-typography-400 px-1">…</Text>}
        </>
      )}

      {pages.map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onPage(p)}
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: p === page ? "#3C3489" : "#F1EFE8" }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: p === page ? "#FFFFFF" : "#5F5E5A" }}
          >
            {p}
          </Text>
        </TouchableOpacity>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <Text className="text-xs text-typography-400 px-1">…</Text>}
          <TouchableOpacity
            onPress={() => onPage(totalPages)}
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: "#F1EFE8" }}
          >
            <Text className="text-xs text-typography-600">{totalPages}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: "#F1EFE8", opacity: page === totalPages ? 0.4 : 1 }}
      >
        <Icon as={ChevronRight} size="xs" className="text-typography-600" />
      </TouchableOpacity>
    </HStack>
  );
}