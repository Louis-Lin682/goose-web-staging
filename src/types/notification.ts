export type NotificationType = "NEW_ORDER";

export type AdminNotificationEntry = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId: string | null;
  orderNumber: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type AdminNotificationsResponse = {
  notifications: AdminNotificationEntry[];
  unreadCount: number;
};

export type MarkNotificationReadResponse = {
  message: string;
  notificationId: string;
};

export type MarkAllNotificationsReadResponse = {
  message: string;
  updatedCount: number;
};
