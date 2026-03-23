import { useContext } from "react";
import {
  AdminNotificationsContext,
  type AdminNotificationsContextType,
} from "./AdminNotificationsContext";

export const useAdminNotifications = (): AdminNotificationsContextType => {
  const context = useContext(AdminNotificationsContext);

  if (!context) {
    throw new Error("useAdminNotifications must be used within an AdminNotificationsProvider");
  }

  return context;
};
