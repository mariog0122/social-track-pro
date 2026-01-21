export type ActivityStatus = 'PENDING' | 'DONE';

export type PlanType = 'BASIC' | 'GROWTH' | 'AUTHORITY';

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: number;
  totalPosts: number;
  postsPerWeek: number; // For UI rendering limit
  totalReels: number;
  features: string[];
}

export interface WeeklyData {
  id: number; // 1, 2, 3, 4
  posts: boolean[]; // Array of up to 4 booleans
  storiesCount: number;
  commentsCount: number;
}

export interface MonthData {
  selectedPlan: PlanType | null;
  monthName: string;
  weeks: WeeklyData[];
  reels: boolean[]; // Array of up to 4 booleans
  clientSignature: string | null;
  signatureDate: string | null;
  aiObservation: string;
}

export interface DashboardStats {
  postsCompleted: number;
  totalPosts: number;
  reelsCompleted: number;
  totalReels: number;
  storiesTotal: number;
  commentsTotal: number;
  progressPercentage: number;
}

export enum ViewState {
  PLAN_SELECTION = 'PLAN_SELECTION',
  DASHBOARD = 'DASHBOARD',
  TRACKER = 'TRACKER',
  REPORT = 'REPORT'
}