import { prisma } from "../config/prisma";
import { BaseRepository } from "./baseRepository";

class DashboardRepository extends BaseRepository<typeof prisma.transaction> {
  constructor() {
    super(prisma.transaction);
  }

  async getDashboardData(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // exclusive upper bound, same as analytics

    const where = this.baseWhere(userId, {
      date: { gte: startDate, lt: endDate },
    });

    const [summary, recentTransactions, categoryBreakdown] = await Promise.all([
      this.delegate.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
        orderBy: { type: "asc" },
      }),

      // Recent 5 transactions regardless of month scope — intentional
      this.delegate.findMany({
        where: this.baseWhere(userId),
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          type: true,
          date: true,
          note: true,
          merchant: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      this.delegate.groupBy({
        by: ["categoryId"],
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    const income = Number(
      summary.find((s) => s.type === "INCOME")?._sum.amount ?? 0,
    );
    const expense = Number(
      summary.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0,
    );

    // Batch-fetch all categories in one query instead of N individual lookups
    const categoryIds = categoryBreakdown
      .map((r) => r.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const topCategories = categoryBreakdown.map((row) => {
      const category = categoryMap.get(row.categoryId!);
      return {
        categoryId: row.categoryId,
        categoryName: category?.name ?? "Unknown",
        icon: category?.icon ?? null,
        total: Number(row._sum.amount ?? 0),
      };
    });

    return {
      month,
      year,
      totalIncome: income,
      totalExpense: expense,
      net: income - expense,
      recentTransactions,
      topCategories,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
