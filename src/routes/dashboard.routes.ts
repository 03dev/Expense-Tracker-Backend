import Router from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { DashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { dashboardDataSchema } from "../validators/dashboard.validator";

const router = Router();

router.get("/", authMiddleware, validate({ query: dashboardDataSchema }), asyncHandler(DashboardController.dashboardData));

export default router;