import { createContext } from "react";
import type { AdminNotificationEntry } from "../types/notification";

export type AdminNotificationsContextType = {
  notifications: AdminNotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isSoundEnabled: boolean;
  enableNotificationSound: () => Promise<void>;
  disableNotificationSound: () => void;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markNotificationsForOrderAsRead: (orderId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
};

export const AdminNotificationsContext =
  createContext<AdminNotificationsContextType | undefined>(undefined);
