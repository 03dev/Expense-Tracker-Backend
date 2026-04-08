import Router from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { DashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", authMiddleware, asyncHandler(DashboardController.dashboardData));

export default router;