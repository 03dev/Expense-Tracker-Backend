import { prisma } from "../config/prisma";

const getMonthlySummary = async (userId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const where = {
        userId,
        deletedAt: null,
        date: { gte: startOfMonth, lt: endOfMonth}
    };

    const [summary, categoryBreakdown, transactionCount] = await prisma.$transaction([

        // 1. Income vs Expense totals
        prisma.transaction.groupBy({
            by: ["type"],
            where,
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        }),

        // 2. Spending per category
        prisma.transaction.groupBy({
            by: ["categoryId"],
            where: {
                ...where,
                type: "EXPENSE"
            },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    amount: "desc"
                }
            },
            take: 10
        }),

        // 3. Total transaction count
        prisma.transaction.count({where})
    ]);

    // Parse groupBy result
    const incomeRow = summary.find(r => r.type === "INCOME");
    const expenseRow = summary.find(r => r.type === "EXPENSE");

    const totalIncome = Number(incomeRow?._sum.amount ?? 0);
    const totalExpense = Number(expenseRow?._sum.amount ?? 0);

    return {
        month,
        year,
        totalIncome,
        totalExpense,
        net: totalExpense - totalExpense,
        transactionCount,
        incomeTransactionCount: incomeRow?._count.id ?? 0,
        expenseTransactionCount: expenseRow?._count ?? 0,
        categoryBreakdown
    }
}

const getLastSixMonthsData = async (userId: string) => {
    const now = new Date();

    // Calculate the date range covering all 6 month at once
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // One query - PostgreSQL groups by month+year internally
    const rows = await prisma.$queryRaw<
    {year: number; month: number; type: string; total: number}[]
    >`
        SELECT
            EXTRACT(YEAR FROM date)::int AS year,
            EXTRACT(MONTH FROM date)::int AS month,
            type,
            SUM(amount):: FLOAT AS total
        FROM "Transaction"
        WHERE
            "userId" = ${userId}
            AND "deletedAt" IS NULL
            AND date >= ${startDate}
            AND date < ${endDate}
        GROUP BY
            EXTRACT(YEAR FROM date),
            EXTRACT(MONTH FROM date),
            type
        ORDER BY
            year ASC, month ASC
    `;

    // Build the 6-month array, filling zeros for month with no data
    const months = [];
    for (let i = 5;i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        // Find maching rows from the single query result
        const incomeRow = rows.find(r => r.year === year && r.month === month && r.type === "INCOME");
        const expenseRow = rows.find(r => r.year === year && r.month === month && r.type === "EXPENSE");

        const income = incomeRow?.total ?? 0;
        const expense = expenseRow?.total ?? 0;

        months.push({
            month,
            year,
            label: date.toLocaleString("default", { month: "short", year: "2-digit"}),
            income,
            expense,
            net: income - expense
        })
    }

    return months;
}

const getTopMerchants = async (userId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    // groupBy does the aggregation
    const result = await prisma.transaction.groupBy({
        by: ["merchant"],
        where: {
            userId,
            deletedAt: null,
            type: "EXPENSE",
            merchant: { not: null},
            date: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        },
        _sum: {
            amount: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                amount: "desc"
            }
        },
        take: 5
    });

    return result.map(r => ({
        merchant: r.merchant!,
        total: Number(r._sum.amount ?? 0),
        transactionCount: r._count.id
    }));
}

export const AnalyticsRepository = {
    getMonthlySummary,
    getLastSixMonthsData,
    getTopMerchants
}