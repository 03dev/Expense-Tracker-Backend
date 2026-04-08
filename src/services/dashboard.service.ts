import { NotFoundError } from "../errors/NotFoundError";
import { DashboardRespository } from "../repositories/dashboard.repository";
import { UserRepository } from "../repositories/user.repository"

export const getDashboardDataService = async (userId: string) => {
    const user = await UserRepository.findUserById(userId);

    if(!user) {
        throw new NotFoundError("User not found");
    }

    const { income, expense, transactions } = await DashboardRespository.dashboardData(userId);

    return {
        totalBalance: income- expense,
        income,
        expense,
        transactions
    }
}