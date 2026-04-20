import { AuthenticatedRequest } from "../types/request.types";
import { Response } from "express";
import { DashboardRespository } from "../repositories/dashboard.repository";
import { getDashboardDataService } from "../services/dashboard.service";
import { getQuery } from "../utils/getValidated";
import { DashboardDataInput } from "../validators/dashboard.validator";

const dashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const query = getQuery<DashboardDataInput>(req);
    const { totalBalance, income, expense, recentTransactions, topCategories} = await getDashboardDataService(userId, query.month, query.year);

    return res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
            totalBalance,
            income,
            expense,
            recentTransactions,
            topCategories
        }
    });
}

export const DashboardController = {
    dashboardData
}