import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { FeedbackItem, AVATAR_PALETTE, CATEGORY_STYLES } from "@/utils/types/feedback";
import { StarRow } from "./starRow";

export function FeedbackCard({ item }: { item: FeedbackItem }) {
  const avatarColor = AVATAR_PALETTE[item.userId % AVATAR_PALETTE.length];
  const catStyle    = item.feedbackCategory ? CATEGORY_STYLES[item.feedbackCategory] : null;

  return (
    <VStack
      className="bg-white rounded-2xl overflow-hidden mb-3"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      <VStack className="p-4 gap-3">
        <HStack className="justify-between items-center">
          <HStack className="gap-3 items-center" style={{ flex: 1 }}>
            <VStack
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor.bg, flexShrink: 0 }}
            >
              <Text className="text-xs font-bold" style={{ color: avatarColor.text }}>
                {item.initials}
              </Text>
            </VStack>
            <VStack className="gap-0.5" style={{ flex: 1 }}>
              <Text className="text-sm font-semibold text-typography-800">
                {item.residentName}
              </Text>
              <HStack className="items-center gap-2">
                <StarRow rating={item.rating} />
                <Text className="text-xs text-typography-400">{item.submittedAt}</Text>
              </HStack>
            </VStack>
          </HStack>

          {catStyle && item.feedbackCategory && (
            <VStack
              className="px-2 py-1 rounded-lg"
              style={{ backgroundColor: catStyle.bg, flexShrink: 0 }}
            >
              <Text className="text-xs font-medium" style={{ color: catStyle.text }}>
                {item.feedbackCategory}
              </Text>
            </VStack>
          )}
        </HStack>

        {item.feedback ? (
          <Text className="text-sm text-typography-500 leading-relaxed">{item.feedback}</Text>
        ) : (
          <Text className="text-sm text-typography-300 italic">No written feedback provided.</Text>
        )}

        <HStack
          className="items-center"
          style={{ borderTopWidth: 0.5, borderTopColor: "#F1EFE8", paddingTop: 10 }}
        >
          <Text className="text-xs text-typography-400">Rating {item.rating}/5</Text>
        </HStack>
      </VStack>
    </VStack>
  );
}