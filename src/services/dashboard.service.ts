import { NotFoundError } from "../errors/NotFoundError";
import { DashboardRespository } from "../repositories/dashboard.repository";
import { UserRepository } from "../repositories/user.repository"

export const getDashboardDataService = async (userId: string, month: number, year: number) => {
    const user = await UserRepository.findUserById(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    const { income, expense, recentTransactions, topCategories } = await DashboardRespository.dashboardData(userId, month, year);

    return {
        totalBalance: income - expense,
        income,
        expense,
        recentTransactions,
        topCategories
    }
}