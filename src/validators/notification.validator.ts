import { z } from "zod";

export const notificationIdSchema = z.object({
    id: z
        .string()
        .uuid("Invalid notification ID")
});

export type NotificationIdInput = z.infer<typeof notificationIdSchema>;