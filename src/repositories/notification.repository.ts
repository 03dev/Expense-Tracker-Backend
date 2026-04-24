import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { GetNotificationsInput } from "../validators/notification.validator";

const notificationSelect = {
    id: true,
    title: true,
    message: true,
    type: true,
    isRead: true,
    createdAt: true
} as const;

const createNotification = async (data: {
    title: string;
    message: string;
    type: NotificationType;
    userId: string;
}) => {
    return prisma.notification.create({
        data: {
            title: data.title,
            message: data.message,
            type: data.type,
            userId: data.userId
        },
        select: notificationSelect
    });
}

const getNotifications = async (userId: string, filter: GetNotificationsInput) => {
    const where = { userId };

    const [notification, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip: (filter.page - 1) * filter.limit,
            take: filter.limit,
            select: notificationSelect
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        })
    ]);

    return {
        notification,
        unreadCount,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total/ filter.limit)
    };
}

const getUnreadCount = async (userId: string) => {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false
        }
    })
}

const markAsRead = async (id: string, userId: string) => {
    return prisma.notification.update({
        where: {
            id,
            userId
        },
        data: {
            isRead: true
        },
        select: notificationSelect
    });
}

const markAllAsRead = async (userId: string) => {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });
}

const deleteNotification = async (id: string, userId: string) => {
    return prisma.notification.delete({
        where: {
            id,
            userId
        }
    });
}

const getNotificationById = async (id: string, userId: string) => {
  return prisma.notification.findFirst({
    where: { id, userId },
    select: notificationSelect
  });
}

export const NotificationRepository = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationById
}