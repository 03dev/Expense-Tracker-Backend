import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { analyticsQuerySchema } from "../validators/analytics.validator";
import { AnalyticsController } from "../controllers/analytics.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", authMiddleware, validate({ query: analyticsQuerySchema }), asyncHandler(AnalyticsController.getAnalytics));

export default router;