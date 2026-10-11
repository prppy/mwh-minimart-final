// models/orderModel.js
// Redemption tickets ("orders"), their expiry, and app settings.
//
// Every redemption transaction is an order with a ticket such as "O-042"
// (counter order) or "P-007" (pre-order). Numbers restart at 001 every day.
//   Counter order:  pending    -> collected            (or expired / cancelled)
//   Pre-order:      preordered -> ready -> collected   (or expired / cancelled)
// Expired and cancelled orders have their points refunded.
import { prisma } from "../lib/db.js";

// All dates are Singapore time (UTC+8, no daylight saving)
const SG_OFFSET_MS = 8 * 60 * 60 * 1000;

export const ORDER_PREFIX = { normal: "O", preorder: "P" };
export const ACTIVE_STATUSES = ["pending", "preordered", "ready"];
export const HISTORY_STATUSES = ["collected", "expired", "cancelled"];
// Statuses that have an expiry clock running
const EXPIRABLE_STATUSES = ["pending", "ready"];

// Allowed staff transitions
const TRANSITIONS = {
  normal: {
    pending: ["collected", "cancelled"],
  },
  preorder: {
    preordered: ["ready", "cancelled"],
    ready: ["collected", "cancelled"],
  },
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const SETTING_DEFAULTS = {
  ticket_expiry_days: "0", // 0 = end of the same day
};

export const MAX_TICKET_EXPIRY_DAYS = 30;

export const getSettings = async () => {
  const rows = await prisma.setting.findMany();
  const settings = { ...SETTING_DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;
  return {
    ticketExpiryDays: parseInt(settings.ticket_expiry_days) || 0,
  };
};

export const updateSettings = async ({ ticketExpiryDays }) => {
  if (ticketExpiryDays !== undefined) {
    const days = parseInt(ticketExpiryDays);
    if (Number.isNaN(days) || days < 0 || days > MAX_TICKET_EXPIRY_DAYS) {
      throw new Error(`Ticket expiry must be between 0 and ${MAX_TICKET_EXPIRY_DAYS} days`);
    }
    await prisma.setting.upsert({
      where: { key: "ticket_expiry_days" },
      update: { value: String(days) },
      create: { key: "ticket_expiry_days", value: String(days) },
    });
  }
  return getSettings();
};

/* ------------------------------------------------------------------ */
/* Time helpers (Singapore time)                                       */
/* ------------------------------------------------------------------ */

/** "YYYY-MM-DD" of the Singapore calendar day containing `date` */
export const sgDateString = (date = new Date()) =>
  new Date(date.getTime() + SG_OFFSET_MS).toISOString().slice(0, 10);

/** Last millisecond of the Singapore day `addDays` after the day containing `date` */
export const endOfSgDay = (date = new Date(), addDays = 0) => {
  const [y, m, d] = sgDateString(date).split("-").map(Number);
  // Midnight starting the following SG day, in UTC, minus 1 ms
  const nextMidnightUtc = Date.UTC(y, m - 1, d + addDays + 1) - SG_OFFSET_MS;
  return new Date(nextMidnightUtc - 1);
};

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

/** Atomically take the next ticket number for today's prefix (runs inside `tx`) */
export const nextTicketNumber = async (tx, prefix, now = new Date()) => {
  const rows = await tx.$queryRaw`
    INSERT INTO "public"."MWH_Ticket_Counter" ("Counter_Date", "Prefix", "Last_Number")
    VALUES (${sgDateString(now)}::date, ${prefix}, 1)
    ON CONFLICT ("Counter_Date", "Prefix")
    DO UPDATE SET "Last_Number" = "MWH_Ticket_Counter"."Last_Number" + 1
    RETURNING "Last_Number"
  `;
  return Number(rows[0].Last_Number);
};

export const formatTicketCode = (prefix, number) =>
  `${prefix}-${String(number).padStart(3, "0")}`;

/** "O-042 · Marcus · 2 items" */
export const formatTicketLabel = (ticketCode, userName, itemCount) => {
  const firstName = (userName || "Resident").trim().split(/\s+/)[0];
  return `${ticketCode} · ${firstName} · ${itemCount} ${itemCount === 1 ? "item" : "items"}`;
};

/** Shape a transaction (with redemptions + user) as an order for the API */
export const serializeOrder = (transaction) => {
  const items = (transaction.redemptions || []).map((r) => ({
    productId: r.productId,
    productName: r.product?.productName ?? "Item",
    tierLabel: r.product?.tierLabel ?? null,
    points: r.product?.points ?? null,
    quantity: r.productQuantity ?? 0,
  }));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const userName = transaction.user?.userName ?? null;
  // Redemptions made before tickets existed have no ticket/status
  const ticketCode = transaction.ticketCode ?? `#${transaction.id}`;

  return {
    id: transaction.id,
    ticketCode,
    ticketLabel: formatTicketLabel(ticketCode, userName, itemCount),
    orderType: transaction.orderType ?? "normal",
    status: transaction.orderStatus ?? "collected",
    userId: transaction.userId,
    userName,
    points: Math.abs(transaction.pointsChange ?? 0),
    itemCount,
    items,
    createdAt: transaction.createdAt ?? transaction.transactionDate,
    readyAt: transaction.readyAt,
    collectedAt: transaction.collectedAt,
    expiresAt: transaction.expiresAt,
    refundedAt: transaction.refundedAt,
  };
};

const orderInclude = {
  redemptions: {
    include: {
      product: { select: { productName: true, tierLabel: true, points: true } },
    },
  },
  user: { select: { userName: true } },
};

/* ------------------------------------------------------------------ */
/* Expiry                                                              */
/* ------------------------------------------------------------------ */

/**
 * Refund an order's points and move it to a terminal status. Only succeeds
 * if the order is still in one of `fromStatuses` (so it is safe to call
 * concurrently — an order is never refunded twice).
 */
const refundOrder = async (tx, transaction, newStatus, fromStatuses) => {
  const now = new Date();
  const claimed = await tx.transaction.updateMany({
    where: {
      id: transaction.id,
      orderStatus: { in: fromStatuses },
      refundedAt: null,
    },
    data: { orderStatus: newStatus, refundedAt: now },
  });
  if (claimed.count === 0) return false;

  const refund = Math.abs(transaction.pointsChange ?? 0);
  if (refund > 0 && transaction.userId) {
    await tx.resident.update({
      where: { userId: transaction.userId },
      data: { currentPoints: { increment: refund } },
    });
  }
  return true;
};

/** Expire every overdue order and refund its points. Returns how many expired. */
export const expireOverdueOrders = async (now = new Date()) => {
  const overdue = await prisma.transaction.findMany({
    where: {
      transactionType: "redemption",
      orderStatus: { in: EXPIRABLE_STATUSES },
      expiresAt: { lt: now },
      refundedAt: null,
    },
    select: { id: true, userId: true, pointsChange: true },
  });

  let expired = 0;
  for (const transaction of overdue) {
    const done = await prisma.$transaction((tx) =>
      refundOrder(tx, transaction, "expired", EXPIRABLE_STATUSES)
    );
    if (done) expired++;
  }
  return expired;
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** A resident's own orders, newest first */
export const findOrdersByUser = async (userId, { limit = 50 } = {}) => {
  await expireOverdueOrders();
  const transactions = await prisma.transaction.findMany({
    where: { userId: parseInt(userId), transactionType: "redemption" },
    include: orderInclude,
    orderBy: [{ createdAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    take: Math.min(parseInt(limit) || 50, 200),
  });
  return transactions.map(serializeOrder);
};

/**
 * Staff order list.
 * scope: 'active' (default) | 'history' | a single status
 */
export const findOrders = async ({ scope = "active", orderType, limit = 100 } = {}) => {
  await expireOverdueOrders();

  let statusFilter;
  if (scope === "active") statusFilter = { in: ACTIVE_STATUSES };
  else if (scope === "history") statusFilter = { in: HISTORY_STATUSES };
  else statusFilter = scope;

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionType: "redemption",
      orderStatus: statusFilter,
      ...(orderType && { orderType }),
    },
    include: orderInclude,
    // Active: oldest first (queue order). History: newest first.
    orderBy:
      scope === "active"
        ? [{ createdAt: "asc" }, { id: "asc" }]
        : [{ createdAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    take: Math.min(parseInt(limit) || 100, 500),
  });
  return transactions.map(serializeOrder);
};

/** Staff status change: ready / collected / cancelled */
export const updateOrderStatus = async (orderId, newStatus) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(orderId) },
  });
  if (!transaction || transaction.transactionType !== "redemption" || !transaction.orderStatus) {
    throw new Error("Order not found");
  }

  const allowed = TRANSITIONS[transaction.orderType]?.[transaction.orderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status change: ${transaction.orderStatus} -> ${newStatus}`
    );
  }

  const now = new Date();
  if (newStatus === "cancelled") {
    const done = await prisma.$transaction((tx) =>
      refundOrder(tx, transaction, "cancelled", [transaction.orderStatus])
    );
    if (!done) throw new Error("Order was already updated, please refresh");
  } else {
    const data = { orderStatus: newStatus };
    if (newStatus === "ready") {
      // The collection window starts when a pre-order is ready
      const { ticketExpiryDays } = await getSettings();
      data.readyAt = now;
      data.expiresAt = endOfSgDay(now, ticketExpiryDays);
    }
    if (newStatus === "collected") data.collectedAt = now;

    const updated = await prisma.transaction.updateMany({
      where: { id: transaction.id, orderStatus: transaction.orderStatus },
      data,
    });
    if (updated.count === 0) throw new Error("Order was already updated, please refresh");
  }

  const fresh = await prisma.transaction.findUnique({
    where: { id: transaction.id },
    include: orderInclude,
  });
  return serializeOrder(fresh);
};

export { orderInclude };
