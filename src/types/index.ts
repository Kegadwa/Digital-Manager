export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  category?: string;
  projectId?: string;
  subtasks: Subtask[];
  createdAt: string;
}

export type TransactionType = "income" | "expense";

export type CardBrand = "visa" | "mastercard" | "amex" | "other";

export interface PaymentMethod {
  id: string;
  name: string;
  type: "cash" | "card" | "bank";
  balance: number;
  currency: string;
  cardNumber?: string;
  cvc?: string;
  color?: string;
  holder?: string;
  expiry?: string;
  brand?: CardBrand;
  linkedAccountId?: string;
  denominations?: Record<string, number>;
}

export interface SavingsSource {
  id: string;
  name: string;
  amount: number;
  methodId?: string;
  date: string;
}

export interface Loan {
  id: string;
  lender: string;
  principal: number;
  totalRepayable: number;
  amountPaid: number;
  interestRate: number;
  interestType: "flat" | "reducing";
  date: string;
  status: "active" | "paid";
  description?: string;
}


export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  methodId?: string;
  description?: string;
  date: string;
  recurring?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc" | "spreadsheet" | "folder" | "other";
  size: number;
  modifiedAt: string;
  starred: boolean;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface ProjectActivity {
  id: string;
  message: string;
  type: "note" | "task" | "status" | "milestone";
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  activities: ProjectActivity[];
  createdAt: string;
}

export interface PortfolioProjectMetric {
  label: string;
  value: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  shortLabel: string;
  year: string;
  category: string;
  url: string;
  image: string;
  summary: string;
  overview: string;
  challenge: string;
  solution: string;
  impact: string;
  stack: string[];
  metrics: PortfolioProjectMetric[];
  layout: "feature" | "standard";
  images?: string[];
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface Education {
  id: string;
  period: string;
  institution: string;
  detail: string;
}

export interface Certification {
  id: string;
  title: string;
  institution: string;
  year: string;
}

export interface Tool {
  id: string;
  name: string;
  logo: string;
}

export interface DesignProject {
  id: string;
  title: string;
  tagline?: string;
  summary: string;
  category: string;
  year: string | number;
  client?: string;
  coverImage: string;
  images: string[];
  tools?: string[];
  tags?: string[];
  credits?: {
    role: string;
    name: string;
  }[];
  isDesign?: true;
  url?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task" | "project" | "finance" | "system";
  timestamp: string;
  read: boolean;
  link?: string;
}
