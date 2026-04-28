import { analyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsQueryInput } from "../validators/analytics.validator";

const getAnalyticsService = async (userId: string, query: AnalyticsQueryInput) => {
  const now = new Date();
  const month = query.month ?? now.getMonth() + 1;
  const year  = query.year  ?? now.getFullYear();

  const lastMonth     = month === 1 ? 12 : month - 1;
  const lastMonthYear = month === 1 ? year - 1 : year;

  const [currentSummary, lastMonthSummary, monthlyTrend, topMerchants] = await Promise.all([
    analyticsRepository.getMonthlySummary(userId, month, year),
    analyticsRepository.getMonthlySummary(userId, lastMonth, lastMonthYear),
    analyticsRepository.getLastSixMonthsData(userId),
    analyticsRepository.getTopMerchants(userId, month, year),
  ]);

  const expenseChange =
    lastMonthSummary.totalExpense === 0
      ? 0
      : parseFloat(
          (
            ((currentSummary.totalExpense - lastMonthSummary.totalExpense) /
              lastMonthSummary.totalExpense) *
            100
          ).toFixed(1),
        );

  return {
    month,
    year,
    totalIncome:        currentSummary.totalIncome,
    totalExpense:       currentSummary.totalExpense,
    net:                currentSummary.net,
    transactionCount:   currentSummary.transactionCount,
    spendingByCategory: currentSummary.categoryBreakdown,
    expenseChange,
    monthlyTrend,
    topMerchants,
  };
};

export const AnalyticsService = {
  getAnalyticsService,
};
