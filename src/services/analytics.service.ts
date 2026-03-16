import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsQueryInput } from "../validators/analytics.validator";

const getAnalyticsService = async (userId: string, query: AnalyticsQueryInput) => {
  const now = new Date();
  const month = query.month ?? now.getMonth() + 1;
  const year = query.year ?? now.getFullYear();

  // Get all transactions for this month
  const transactions = await AnalyticsRepository.getMonthlySummary(userId, month, year);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Spending by category
  const categoryMap = new Map<string, { name: string; total: number }>();
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const categoryId = t.categoryId;
      const categoryName = t.category.name;
      const current = categoryMap.get(categoryId) ?? { name: categoryName, total: 0 };
      categoryMap.set(categoryId, {
        name: categoryName,
        total: current.total + Number(t.amount)
      });
    });

  const spendingByCategory = Array.from(categoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  // Last 6 months trend
  const monthlyTrend = await AnalyticsRepository.getLastSixMonthsData(userId);

  // Top merchants
  const topMerchants = await AnalyticsRepository.getTopMerchants(userId, month, year);

  // Month over month comparison
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastMonthYear = month === 1 ? year - 1 : year;
  const lastMonthTransactions = await AnalyticsRepository.getMonthlySummary(userId, lastMonth, lastMonthYear);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseChange = lastMonthExpenses === 0
    ? 0
    : ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

  return {
    month,
    year,
    totalIncome,
    totalExpenses,
    netBalance,
    expenseChange: expenseChange.toFixed(1),
    spendingByCategory,
    monthlyTrend,
    topMerchants,
  };
}

export const AnalyticsService = {
  getAnalyticsService
}