import { apiRequest } from "./api";
import type {
  AdminNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from "../types/notification";

export const getAdminNotifications = async (): Promise<AdminNotificationsResponse> => {
  return apiRequest<AdminNotificationsResponse>("/admin/notifications");
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<MarkNotificationReadResponse> => {
  return apiRequest<MarkNotificationReadResponse>(
    `/admin/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    },
  );
};

export const markAllNotificationsAsRead =
  async (): Promise<MarkAllNotificationsReadResponse> => {
    return apiRequest<MarkAllNotificationsReadResponse>("/admin/notifications/read-all", {
      method: "PATCH",
    });
  };
