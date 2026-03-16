import { Response } from "express";
import { AuthenticatedRequest } from "../types/request.types";
import { getQuery } from "../utils/getValidated";
import { AnalyticsQueryInput } from "../validators/analytics.validator";
import { AnalyticsService } from "../services/analytics.service";

const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  const query = getQuery<AnalyticsQueryInput>(req);
  const analytics = await AnalyticsService.getAnalyticsService(req.user.id, query);
  return res.status(200).json({
    success: true,
    message: "Analytics fetched successfully",
    data: analytics
  });
}

export const AnalyticsController = {
  getAnalytics
}