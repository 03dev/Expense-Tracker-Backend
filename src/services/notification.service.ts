import { NotFoundError } from "../errors/NotFoundError";
import { NotificationRepository } from "../repositories/notification.repository"

const getNotificationsService = async  (userId: string) => {
    return NotificationRepository.getNotifications(userId);
}

const getUnreadCountService = async (userId: string) => {
    return NotificationRepository.getUnreadCount(userId);
}

const markAsReadService = async (id: string, userId: string) => {
    const notification = await NotificationRepository.getNotificationById(id, userId);

    if(!notification) {
        throw new NotFoundError("Notification not found");
    }

    await NotificationRepository.markAsRead(id, userId);
}

const markAllAsReadService = async (userId: string) => {
    await NotificationRepository.markAllAsRead(userId);
}

const deleteNotificationService = async (id: string, userId: string) => {
    const notification = await NotificationRepository.getNotificationById(id, userId);

    if(!notification) {
        throw new NotFoundError("Notification not found");
    }

    await NotificationRepository.deleteNotification(id, userId);
}

export const NotificationService = {
    getNotificationsService,
    getUnreadCountService,
    markAsReadService,
    markAllAsReadService,
    deleteNotificationService
}