import { Order, OrderStatus } from "./types";

// Display info for each order status
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; bg: string; fg: string }
> = {
  pending: { label: "Ready to collect", bg: "#DCFCE7", fg: "#166534" },
  preordered: { label: "Pre-ordered", bg: "#FFE7D6", fg: "#9A3412" },
  ready: { label: "Ready to collect", bg: "#DCFCE7", fg: "#166534" },
  collected: { label: "Collected", bg: "#E5E7EB", fg: "#374151" },
  expired: { label: "Expired · refunded", bg: "#FEE2E2", fg: "#991B1B" },
  cancelled: { label: "Cancelled · refunded", bg: "#FEE2E2", fg: "#991B1B" },
};

// Status tracker steps for pre-orders
export const PREORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "preordered", label: "Pre-ordered" },
  { status: "ready", label: "Ready to collect" },
  { status: "collected", label: "Collected" },
];

/** Index of the current pre-order step (expired/cancelled stop where they were) */
export const preorderStepIndex = (order: Order) => {
  if (order.status === "collected") return 2;
  if (order.status === "ready") return 1;
  if (order.readyAt) return 1;
  return 0;
};

export const isActiveOrder = (order: Order) =>
  order.status === "pending" || order.status === "preordered" || order.status === "ready";

/** e.g. "Sat, 4 Oct, 11:59 pm" in Singapore time */
export const formatSgDateTime = (iso: string | null | undefined) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** "today", "tomorrow" or a date, for "Collect by …" messages */
export const describeDeadline = (iso: string | null | undefined) => {
  if (!iso) return "";
  const sgDay = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); // YYYY-MM-DD
  const deadline = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const time = deadline.toLocaleTimeString("en-SG", {
    timeZone: "Asia/Singapore",
    hour: "numeric",
    minute: "2-digit",
  });
  if (sgDay(deadline) === sgDay(today)) return `today, ${time}`;
  if (sgDay(deadline) === sgDay(tomorrow)) return `tomorrow, ${time}`;
  return formatSgDateTime(iso);
};

/** One-line explanation of what the resident needs to do next */
export const orderNextStep = (order: Order) => {
  switch (order.status) {
    case "pending":
    case "ready":
      return order.expiresAt
        ? `Show this ticket at the counter. Collect by ${describeDeadline(order.expiresAt)}.`
        : "Show this ticket at the counter.";
    case "preordered":
      return "Staff will mark this ready when the item arrives.";
    case "collected":
      return order.collectedAt ? `Collected ${formatSgDateTime(order.collectedAt)}.` : "Collected.";
    case "expired":
      return "Not collected in time. Your points have been returned.";
    case "cancelled":
      return "Cancelled by staff. Your points have been returned.";
    default:
      return "";
  }
};

/** "Same day" / "1 day" / "N days" for the ticket expiry setting */
export const describeExpirySetting = (days: number) => {
  if (days === 0) return "the end of the same day";
  if (days === 1) return "the end of the next day";
  return `the end of the day, ${days} days later`;
};
