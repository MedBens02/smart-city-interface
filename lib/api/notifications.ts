import { apiRequest } from "./client"
import type { Notification } from "@/lib/types"

// Fetch all notifications for current user
export async function fetchNotifications(token: string): Promise<Notification[]> {
  return apiRequest<Notification[]>("/api/notifications", { method: "GET" }, token)
}

// Mark notification as read
export async function markNotificationRead(notificationId: string, token: string): Promise<void> {
  return apiRequest<void>(`/api/notifications/${notificationId}/read`, { method: "PATCH" }, token)
}

// Mark all notifications as read
export async function markAllNotificationsRead(token: string): Promise<void> {
  return apiRequest<void>("/api/notifications/read-all", { method: "PATCH" }, token)
}
