import z from "zod";

export const dashboardDataSchema = z.object({
    month: z.coerce.number()  // ← coerce converts "4" string to 4 number
        .int()
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12")
        .default(new Date().getMonth() + 1),
    year: z.coerce.number()   // ← coerce converts "2026" string to 2026 number
        .int()
        .min(2000, "Year must be 2000 or later")
        .max(new Date().getFullYear(), "Year cannot be in the future")
        .default(new Date().getFullYear())
}).strict();

export type DashboardDataInput = z.infer<typeof dashboardDataSchema>;