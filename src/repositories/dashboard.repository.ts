import { prisma } from "../config/prisma";

const dashboardData = async (
    userId: string,
    month: number,
    year: number
) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [summary, recentTransactions, categoryBreakdown] = await Promise.all([
        // 1. Get both income and expense in ONE query using groupBy
        prisma.transaction.groupBy({
            by: ["type"],
            where: {
                userId,
                deletedAt: null,
                date: {gte: startDate, lte: endDate}
            },
            _sum: {
                amount: true
            },
            orderBy: []
        }),

        // 2. Recent transactions with select (not include)
        prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null
            },
            orderBy: {
                date: "desc"
            },
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
                        name: true
                    }
                }
            }
        }),

        // 3. Top spending categories — actually useful for a dashboard
        prisma.transaction.groupBy({
            by: ["categoryId"],
            where: {
                userId,
                type: "EXPENSE",
                deletedAt: null,
                date: {gte: startDate, lte: endDate}
            },
            _sum: {
                amount: true
            },
            orderBy: {
                _sum: {
                    amount: "desc"
                }
            },
            take: 5
        })
    ])

    // Parse the groupBy result cleanly
    const incomeData = summary.find(s => s.type === "INCOME");
    const expenseData = summary.find(s => s.type === "EXPENSE");

    return {
        income: Number(incomeData?._sum?.amount ?? 0),
        expense: Number(expenseData?._sum?.amount ?? 0),
        recentTransactions,
        topCategories: categoryBreakdown
    }
}

export const DashboardRespository = {
    dashboardData
}