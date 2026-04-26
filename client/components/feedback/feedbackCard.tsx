import { useState } from "react";
import { TouchableOpacity } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { SentimentBadge } from "@/components/feedback/sentimentBadge";
import { markFeedbackReviewed, unmarkFeedbackReviewed } from "@/utils/api/feedback";
import { AVATAR_PALETTE, CATEGORY_STYLES, type FeedbackItem } from "@/utils/types/feedback";

interface FeedbackCardProps {
  item:           FeedbackItem;
  onStatusChange: (feedbackId: number) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const avatarStyle   = AVATAR_PALETTE[(item.userId ?? 0) % AVATAR_PALETTE.length];
  const categoryStyle = item.feedbackCategory
    ? CATEGORY_STYLES[item.feedbackCategory]
    : { bg: "#F1EFE8", text: "#5F5E5A" };

  async function handleMarkReviewed() {
    setLoading(true);
    try {
      await markFeedbackReviewed(item.feedbackId);
      onStatusChange(item.feedbackId);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack
      className="bg-white rounded-xl p-3 mb-2 gap-2"
      style={{ borderWidth: 0.5, borderColor: "#E8E6DF" }}
    >
      {/* Top row: avatar + name + date + status badge */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-2">
          <VStack
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: avatarStyle.bg }}
          >
            <Text style={{ fontSize: 10, fontWeight: 700, color: avatarStyle.text }}>
              {item.initials}
            </Text>
          </VStack>
          <VStack>
            <Text className="text-xs font-medium text-typography-800">{item.residentName}</Text>
            <Text style={{ fontSize: 10, color: "#B4B2A9" }}>{item.submittedAt}</Text>
          </VStack>
        </HStack>

        {/* Status badge */}
        <VStack
          className="px-2 py-0.5 rounded-md"
          style={{ backgroundColor: item.feedbackStatus === "reviewed" ? "#E1F5EE" : "#FEF3C7" }}
        >
          <Text style={{
            fontSize:   10,
            fontWeight: 600,
            color: item.feedbackStatus === "reviewed" ? "#0F6E56" : "#92400E",
          }}>
            {item.feedbackStatus === "reviewed" ? "Reviewed" : "New"}
          </Text>
        </VStack>
      </HStack>

      {/* Feedback text */}
      {item.feedback && (
        <Text className="text-xs text-typography-600">
          {item.feedback}
        </Text>
      )}

      {/* Bottom row: sentiment + category + action button */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-1">
          <SentimentBadge rating={item.rating as 1 | 2 | 3} />
          {item.feedbackCategory && (
            <VStack
              className="px-2 py-0.5 rounded-md"
              style={{ backgroundColor: categoryStyle.bg }}
            >
              <Text style={{ fontSize: 10, fontWeight: 600, color: categoryStyle.text }}>
                {item.feedbackCategory.charAt(0).toUpperCase() + item.feedbackCategory.slice(1)}
              </Text>
            </VStack>
          )}
        </HStack>

        {item.feedbackStatus === "new" ? (
          <TouchableOpacity
            onPress={handleMarkReviewed}
            disabled={loading}
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "#3C3489", opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>
              {loading ? "Saving..." : "Mark reviewed"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleUnmarkReviewed}
            disabled={loading}
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "#F1EFE8", opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#534AB7" }}>
              {loading ? "Saving..." : "Unmark reviewed"}
            </Text>
          </TouchableOpacity>
        )}
      </HStack>
    </VStack>
  );
};