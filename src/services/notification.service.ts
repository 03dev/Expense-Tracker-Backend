import { NotFoundError } from "../errors/NotFoundError";
import { notificationRepository } from "../repositories/notification.repository";
import { GetNotificationsInput } from "../validators/notification.validator";

const getNotificationsService = async (userId: string, filter: GetNotificationsInput) => {
  return notificationRepository.getNotifications(userId, filter);
};

const getUnreadCountService = async (userId: string) => {
  return notificationRepository.getUnreadCount(userId);
};

const markAsReadService = async (id: string, userId: string) => {
  const notification = await notificationRepository.getNotificationById(id, userId);
  if (!notification) throw new NotFoundError("Notification not found");
  return notificationRepository.markAsRead(id, userId);
};

const markAllAsReadService = async (userId: string) => {
  await notificationRepository.markAllAsRead(userId);
};

const deleteNotificationService = async (id: string, userId: string) => {
  const notification = await notificationRepository.getNotificationById(id, userId);
  if (!notification) throw new NotFoundError("Notification not found");
  await notificationRepository.deleteNotification(id, userId);
};

export const NotificationService = {
  getNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
};
