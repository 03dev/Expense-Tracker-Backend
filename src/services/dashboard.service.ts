import { dashboardRepository } from "../repositories/dashboard.repository";

const getDashboardDataService = async (userId: string, month: number, year: number) => {
  const data = await dashboardRepository.getDashboardData(userId, month, year);
  return {
    month: data.month,
    year: data.year,
    totalBalance: data.net,
    totalIncome: data.totalIncome,
    totalExpense: data.totalExpense,
    recentTransactions: data.recentTransactions,
    topCategories: data.topCategories,
  };
};

export const DashboardService = {
  getDashboardDataService,
};
