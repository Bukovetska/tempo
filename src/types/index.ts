export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'work' | 'study' | 'personal' | 'health';

export interface UserSettings {
  timezone: string;
  notificationsEnabled: boolean;
  weeklyReportEnabled: boolean;
  dailySummaryEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  settings: UserSettings;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  scheduledAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  estimatedTime: number;
  categoryLabel?: string;
  categoryColor?: string;
}

export interface WeeklyStat {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface CategoryStat {
  category: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface AnalyticsData {
  weeklyStats: WeeklyStat[];
  categoryStats: CategoryStat[];
  averageRate: number;
  bestDay: string;
  currentStreak: number;
}