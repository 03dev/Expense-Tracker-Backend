import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";

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
        }
    });
}

const getNotifications = async (userId: string) => {
    return prisma.notification.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    });
}

const getUnreadCount = async (userId: string) => {
    return prisma.notification.findMany({
        where: {
            userId,
            isRead: false
        }
    });
}

const markAsRead = async (id: string, userId: string) => {
    return prisma.notification.update({
        where: {
            id,
            userId
        },
        data: {
            isRead: true
        }
    });
}

const markAllAsRead = async (userId: string) => {
    return prisma.notification.updateMany({
        where: {
            userId
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
    where: { id, userId }
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