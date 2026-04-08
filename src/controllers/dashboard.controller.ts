import { AuthenticatedRequest } from "../types/request.types";
import { Response } from "express";
import { DashboardRespository } from "../repositories/dashboard.repository";
import { getDashboardDataService } from "../services/dashboard.service";

const dashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const { totalBalance, income, expense, transactions } = await getDashboardDataService(userId);

    return res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
            totalBalance,
            income,
            expense,
            transactions
        }
    });
}

export const DashboardController = {
    dashboardData
}