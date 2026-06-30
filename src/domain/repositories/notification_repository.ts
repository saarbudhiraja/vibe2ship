import { NotificationEntity } from '../entities/notification';

export interface NotificationRepository {
  /**
   * Fetches all system notifications for a user/role
   */
  getNotifications(role: 'citizen' | 'authority'): Promise<NotificationEntity[]>;

  /**
   * Marks a notification as read
   */
  markAsRead(notificationId: string): Promise<void>;

  /**
   * Marks all notifications as read for a role
   */
  markAllAsRead(role: 'citizen' | 'authority'): Promise<void>;

  /**
   * Clears a notification
   */
  deleteNotification(notificationId: string): Promise<void>;

  /**
   * Dispatches a new notification to Firestore / subscribers
   */
  sendNotification(notification: Omit<NotificationEntity, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationEntity>;
}
