import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { getParams, getQuery } from "../utils/getValidated";
import { GetNotificationsInput, NotificationIdInput } from "../validators/notification.validator";
import { NotificationService } from "../services/notification.service";

const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    const query = getQuery<GetNotificationsInput>(req);
    const notifications = await NotificationService.getNotificationsService(req.user.id, query);
    return res.status(200).json({
        success: true,
        message: "Notification fetched successfully",
        data: notifications
    });
}

const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
    const unreadCount = await NotificationService.getUnreadCountService(req.user.id);

    return res.status(200).json({
        success: true,
        message: "Notification unread count fetched successfully",
        data: unreadCount
    });
}

const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    const params = getParams<NotificationIdInput>(req);
    await NotificationService.markAsReadService(params.id, req.user.id);

    return res.status(200).json({
        success: true,
        message: "Notification mark as read successfully"
    });
}

const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    await NotificationService.markAllAsReadService(req.user.id);

    return res.status(200).json({
        success: true,
        message: "All notification mark as read successfully"
    });
}

const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
    const params = getParams<NotificationIdInput>(req);
    await NotificationService.deleteNotificationService(params.id, req.user.id);

    return res.status(200).json({
        success: true,
        message: "Notification deleted successfully"
    });
}

export const NotificationController = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
}