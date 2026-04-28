import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { NotificationController } from "../controllers/notification.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { notificationIdSchema, getNoficationSchema } from "../validators/notification.validator";

const router = Router();

router.get("/", authMiddleware, validate({query: getNoficationSchema}), asyncHandler(NotificationController.getNotifications));

router.get("/unread-count", authMiddleware, asyncHandler(NotificationController.getUnreadCount));

router.patch("/:id/read", authMiddleware, validate({params: notificationIdSchema}), asyncHandler(NotificationController.markAsRead));

router.patch("/read-all", authMiddleware, asyncHandler(NotificationController.markAllAsRead));

router.delete("/:id", authMiddleware, validate({params: notificationIdSchema}), asyncHandler(NotificationController.deleteNotification));

export default router;