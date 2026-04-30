import { coerce, z } from "zod";

export const notificationIdSchema = z.object({
    id: z
        .string()
        .uuid("Invalid notification ID")
});

export const getNoficationSchema = z.object({
    page: z
        .coerce
        .number()
        .min(1)
        .default(1),
    limit: z
        .coerce
        .number()
        .min(1)
        .max(100)
        .default(20)
}).strict();

export type GetNotificationsInput = z.infer<typeof getNoficationSchema>;
export type NotificationIdInput = z.infer<typeof notificationIdSchema>;