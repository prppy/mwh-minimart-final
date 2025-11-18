import { User } from "./auth";

type Resident = {
  id: number;
  userName: string;
  userRole: "resident";
  profilePicture: string | undefined;

  createdAt: Date;
  updatedAt: Date;

  batchNumber: number;
  currentPoints: number;
  totalPoints: number;

  dateOfAdmission: Date;
  dateOfBirth: Date;
  lastAbscondence: string | null;

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
}

interface Voucher {
  id: number;
  taskName: string;
  taskDescription: string;
  taskCategoryId: number;
  taskCategory: TaskCategory;
  imageUrl: string;
  points: number;
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
  periodPoints: number;
};

interface WheelParticipant {
  id: string;
  name: string;
  profilePicture?: string;
}

export type {
  Category,
  Completion,
  Officer,
  Product,
  Performer,
  Resident,
  TaskCategory,
  Transaction,
  Voucher,
  WheelParticipant,
};
