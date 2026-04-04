import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { markFeedbackReviewed, unmarkFeedbackReviewed } from "@/utils/api/feedback";
import type { FeedbackItem } from "@/utils/types/feedback";
import { CATEGORY_STYLES, AVATAR_PALETTE } from "@/utils/types/feedback";

interface FeedbackCardProps {
  item:           FeedbackItem;
  onStatusChange: (feedbackId: number) => void;  // tells parent to reload
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const avatarStyle  = AVATAR_PALETTE[item.userId % AVATAR_PALETTE.length];
  const categoryStyle = item.feedbackCategory
    ? CATEGORY_STYLES[item.feedbackCategory]
    : { bg: "#F1EFE8", text: "#5F5E5A" };

  async function handleMarkReviewed() {
    setLoading(true);
    try {
      await markFeedbackReviewed(item.feedbackId);
      onStatusChange(item.feedbackId);  // triggers reload in parent
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnmarkReviewed() {
  setLoading(true);
  try {
    await unmarkFeedbackReviewed(item.feedbackId);
    onStatusChange(item.feedbackId);
  } finally {
    setLoading(false);
  }
}

  return (
    <VStack
      className="bg-white rounded-2xl p-4 mb-3 gap-3"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      {/* Top row: avatar + name + date + status badge */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-2">
          <VStack
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: avatarStyle.bg }}
          >
            <Text style={{ fontSize: 11, fontWeight: 700, color: avatarStyle.text }}>
              {item.initials}
            </Text>
          </VStack>
          <VStack className="gap-0">
            <Text className="text-sm font-medium text-typography-800">{item.residentName}</Text>
            <Text className="text-xs text-typography-400">{item.submittedAt}</Text>
          </VStack>
        </HStack>

        {/* Status badge */}
        <VStack
          className="px-2 py-1 rounded-lg"
          style={{
            backgroundColor: item.feedbackStatus === "reviewed" ? "#E1F5EE" : "#FEF3C7",
          }}
        >
          <Text
            style={{
              fontSize:   11,
              fontWeight: 600,
              color: item.feedbackStatus === "reviewed" ? "#0F6E56" : "#92400E",
            }}
          >
            {item.feedbackStatus === "reviewed" ? "Reviewed" : "New"}
          </Text>
        </VStack>
      </HStack>

      {/* Rating */}
      <Text style={{ color: "#F59E0B", fontSize: 13 }}>
        {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
      </Text>

      {/* Feedback text */}
      {item.feedback && (
        <Text className="text-sm text-typography-600">{item.feedback}</Text>
      )}

      {/* Bottom row: category + action button */}
      <HStack className="items-center justify-between">
        {item.feedbackCategory && (
          <VStack
            className="px-2 py-1 rounded-lg"
            style={{ backgroundColor: categoryStyle.bg }}
          >
            <Text style={{ fontSize: 11, fontWeight: 600, color: categoryStyle.text }}>
              {item.feedbackCategory.charAt(0).toUpperCase() + item.feedbackCategory.slice(1)}
            </Text>
          </VStack>
        )}

        {/* Only show button if not yet reviewed */}
        {item.feedbackStatus === "new" ? (
        <TouchableOpacity
            onPress={handleMarkReviewed}
            disabled={loading}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#3C3489", opacity: loading ? 0.6 : 1 }}
        >
            <Text style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>
            {loading ? "Saving..." : "Mark reviewed"}
            </Text>
        </TouchableOpacity>
        ) : (
        <TouchableOpacity
            onPress={handleUnmarkReviewed}
            disabled={loading}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#F1EFE8", opacity: loading ? 0.6 : 1 }}
        >
            <Text style={{ fontSize: 11, fontWeight: 600, color: "#534AB7" }}>
            {loading ? "Saving..." : "Unmark reviewed"}
            </Text>
        </TouchableOpacity>
        )}
      </HStack>
    </VStack>
  );
};