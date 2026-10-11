import { User } from "./auth";

type Resident = {
  id: number;
  userName: string;
  userRole: "resident" | "officer" | "developer" | "admin" | "superadmin";
  profilePicture: string | undefined;

  createdAt: Date;
  updatedAt: Date;

  serialNumber: string | null;
  batchNumber: number;
  currentPoints: number;
  totalPoints: number;

  dateOfAdmission: Date;
  dateOfBirth: Date;
  lastAbscondence: string | null;

  isActive: boolean;
  remarks: string | null;

  backgroundType: string; // theme
  wallpaperType: string; // colour
};

type Officer = {
  id: number;
  userName: string;
  userRole: "officer";
  profilePicture: string | undefined;

  createdAt: Date;
  updatedAt: Date;

  officerEmail: string;
};

interface Category {
  id: number;
  categoryName: string;
}

interface TaskCategory {
  id: number;
  taskCategoryName: string;
  taskCategoryDescription: string;
  iconName?: string;
}

interface ProductCategoryEntry {
  categoryId: number;
  categoryName: string;
}

interface Product {
  id: number;
  productName: string;
  productDescription: string;
  categoryId: number;
  category: Category;
  imageUrl: string;
  available: boolean;
  points: number;
  redemptionCount?: number;
  Type_ID?: number | null;
  typeId?: number | null;
  MWH_Type?: {
    Type_ID: number;
    Type_Name: string;
  } | null;
  // Tiered products share a productGroup (e.g. "Chocolates") with a tierLabel (e.g. "Small")
  productGroup?: string | null;
  tierLabel?: string | null;
  maxPerOrder?: number | null;
  isPreorder?: boolean;
}

interface Voucher {
  id: number;
  taskName: string;
  taskDescription: string;
  taskCategoryId: number;
  taskCategory: TaskCategory;
  imageUrl: string;
  points: number;
  taskDate: string;
  _count: { completions: number };
  completions: Completion[];
}

interface Transaction {
  id: number;
  transactionDate: Date;
  pointsChange: number;
  transactionType: "completion" | "redemption" | "abscondence";
  userId: number;
  user: User;
}

interface Completion {
  transactionId: number;
  taskId: number;
  transaction: Transaction;
}

type Performer = {
  rank: number;
  userId: number;
  userName: string;
  profilePicture?: string;
  currentPoints: number;
  totalPoints: number;
  batchNumber: number;
  dateOfAdmission: Date;
  backgroundType: string;
  wallpaperType: string;
  vouchersAwarded: number;
};

// Redemption ticket. Counter orders: pending -> collected.
// Pre-orders: preordered -> ready -> collected. Expired/cancelled are refunded.
type OrderStatus =
  | "pending"
  | "preordered"
  | "ready"
  | "collected"
  | "expired"
  | "cancelled";

interface OrderItem {
  productId: number;
  productName: string;
  tierLabel: string | null;
  points: number | null;
  quantity: number;
}

interface Order {
  id: number;
  ticketCode: string; // "O-042"
  ticketLabel: string; // "O-042 · Marcus · 2 items"
  orderType: "normal" | "preorder";
  status: OrderStatus;
  userId: number;
  userName: string | null;
  points: number;
  itemCount: number;
  items: OrderItem[];
  createdAt: string;
  readyAt: string | null;
  collectedAt: string | null;
  expiresAt: string | null;
  refundedAt: string | null;
}

interface AppSettings {
  ticketExpiryDays: number; // 0 = end of the same day
}

interface WheelParticipant {
  id: string;
  name: string;
  profilePicture?: string;
}

export type {
  AppSettings,
  Category,
  Completion,
  Officer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Performer,
  Resident,
  TaskCategory,
  Transaction,
  Voucher,
  WheelParticipant,
};
