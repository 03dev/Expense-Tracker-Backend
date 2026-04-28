import { prisma } from "../config/prisma";
import { BaseRepository } from "./baseRepository";

class AnalyticsRepository extends BaseRepository<typeof prisma.transaction> {
  constructor() {
    super(prisma.transaction);
  }

  private getMonthRange(month: number, year: number) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1),
    };
  }

  async getMonthlySummary(userId: string, month: number, year: number) {
    const { start, end } = this.getMonthRange(month, year);
    const where = this.baseWhere(userId, {
      date: { gte: start, lt: end },
    });

    const [
      summary,
      categoryBreakdown,
      transactionCount,
      incomeCount,
      expenseCount,
    ] = await Promise.all([
      this.delegate.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
        orderBy: { type: "asc" },
      }),
      this.delegate.groupBy({
        by: ["categoryId"],
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      }),
      this.delegate.count({ where }),
      this.delegate.count({ where: { ...where, type: "INCOME" } }),
      this.delegate.count({ where: { ...where, type: "EXPENSE" } }),
    ]);

    const income = Number(
      summary.find((r) => r.type === "INCOME")?._sum.amount ?? 0,
    );
    const expense = Number(
      summary.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0,
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

    const enrichedBreakdown = categoryBreakdown.map((row) => {
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
      transactionCount,
      incomeTransactionCount: incomeCount,
      expenseTransactionCount: expenseCount,
      categoryBreakdown: enrichedBreakdown,
    };
  }

  async getLastSixMonthsData(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await prisma.$queryRaw<
      { year: number; month: number; type: string; total: number }[]
    >`
      SELECT
        EXTRACT(YEAR FROM date)::int  AS year,
        EXTRACT(MONTH FROM date)::int AS month,
        type::text                    AS type,
        SUM(amount)::float            AS total
      FROM "Transaction"
      WHERE
        "userId"    = ${userId}
        AND "deletedAt" IS NULL
        AND date   >= ${startDate}
        AND date    < ${endDate}
      GROUP BY
        EXTRACT(YEAR  FROM date),
        EXTRACT(MONTH FROM date),
        type
      ORDER BY year, month
    `;

    const normalized = rows.map((r) => ({
      ...r,
      year: Number(r.year),
      month: Number(r.month),
      total: Number(r.total),
    }));

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const incomeRow = normalized.find(
        (r) => r.year === year && r.month === month && r.type === "INCOME",
      );
      const expenseRow = normalized.find(
        (r) => r.year === year && r.month === month && r.type === "EXPENSE",
      );

      const income = incomeRow?.total ?? 0;
      const expense = expenseRow?.total ?? 0;

      months.push({
        month,
        year,
        label: date.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        income,
        expense,
        net: income - expense,
      });
    }

    return months;
  }

  async getTopMerchants(userId: string, month: number, year: number) {
    const { start, end } = this.getMonthRange(month, year);

    const result = await this.delegate.groupBy({
      by: ["merchant"],
      where: this.baseWhere(userId, {
        type: "EXPENSE",
        merchant: { not: null },
        date: { gte: start, lt: end },
      }),
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    return result.map((r) => ({
      merchant: r.merchant!,
      total: Number(r._sum.amount ?? 0),
    }));
  }
}

export const analyticsRepository = new AnalyticsRepository();
