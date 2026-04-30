import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { GetNotificationsInput } from "../validators/notification.validator";

const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  createdAt: true,
} as const;

class NotificationRepository {
  async createNotification(
    userId: string,
    data: { title: string; message: string; type: NotificationType },
  ) {
    return prisma.notification.create({
      data: { ...data, userId },
      select: notificationSelect,
    });
  }

  async getNotifications(userId: string, filter: GetNotificationsInput) {
    const where = { userId };
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        select: notificationSelect,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false}}),
    ]);

    return {
      notifications,
      unreadCount,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  async getNotificationById(id: string, userId: string) {
    return prisma.notification.findFirst({
      where: { id, userId },
      select: notificationSelect,
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id_userId: { id, userId } },
      data: { isRead: true },
      select: notificationSelect,
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id_userId: { id, userId } },
    });
  }
}

export const notificationRepository = new NotificationRepository();
