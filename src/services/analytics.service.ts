import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsQueryInput } from "../validators/analytics.validator";

const getAnalyticsService = async (userId: string, query: AnalyticsQueryInput) => {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year  = query.year  ?? now.getFullYear();

    // Last month calculation for comparison
    const lastMonth     = month === 1 ? 12 : month - 1;
    const lastMonthYear = month === 1 ? year - 1 : year;

    // All three run, last six months is independent
    const [currentSummary, lastMonthSummary, monthlyTrend, topMerchants] = await Promise.all([
        AnalyticsRepository.getMonthlySummary(userId, month, year),
        AnalyticsRepository.getMonthlySummary(userId, lastMonth, lastMonthYear),
        AnalyticsRepository.getLastSixMonthsData(userId),
        AnalyticsRepository.getTopMerchants(userId, month, year)
    ]);

    // Month over month expense change
    const expenseChange = lastMonthSummary.totalExpense === 0
        ? 0
        : ((currentSummary.totalExpense - lastMonthSummary.totalExpense) 
           / lastMonthSummary.totalExpense) * 100;

    return {
        month,
        year,
        totalIncome:        currentSummary.totalIncome,
        totalExpense:       currentSummary.totalExpense,
        net:                currentSummary.net,
        transactionCount:   currentSummary.transactionCount,
        spendingByCategory: currentSummary.categoryBreakdown,
        expenseChange:      expenseChange.toFixed(1),
        monthlyTrend,
        topMerchants,
    };
}

export const AnalyticsService = {
    getAnalyticsService
}