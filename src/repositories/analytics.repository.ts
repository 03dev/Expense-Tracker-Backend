import { prisma } from "../config/prisma";

const getMonthlySummary = async (userId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const where = {
        userId,
        deletedAt: null,
        date: { gte: startOfMonth, lt: endOfMonth}
    };

    const [summary, categoryBreakdown, transactionCount, incomeCount, expenseCount] = await Promise.all([

        // 1. Income vs Expense totals
        prisma.transaction.groupBy({
            by: ["type"],
            where,
            _sum: {
                amount: true
            },
            orderBy: []
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
            orderBy: {
                _sum: {
                    amount: "desc"
                }
            },
            take: 10
        }),

        // 3. Total transaction count
        prisma.transaction.count({where}),
        prisma.transaction.count({ where: { ...where, type: "INCOME" } }),
        prisma.transaction.count({ where: { ...where, type: "EXPENSE" } }),
    ]);

    // Parse groupBy result
    const incomeRow = summary.find(r => r.type === "INCOME");
    const expenseRow = summary.find(r => r.type === "EXPENSE");

    const totalIncome = Number(incomeRow?._sum?.amount ?? 0);
    const totalExpense = Number(expenseRow?._sum?.amount ?? 0);

    return {
        month,
        year,
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactionCount,
        incomeTransactionCount: incomeCount,
        expenseTransactionCount: expenseCount,
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
            type::text AS type,
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

    const normalized = rows.map(r => ({
    ...r,
        year:  Number(r.year),
        month: Number(r.month),
        total: Number(r.total)
    }));

    // Build the 6-month array, filling zeros for month with no data
    const months = [];
    for (let i = 5;i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        // Find maching rows from the single query result
        const incomeRow  = normalized.find(r => r.year === year && r.month === month && r.type === "INCOME");
        const expenseRow = normalized.find(r => r.year === year && r.month === month && r.type === "EXPENSE");

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
                lt: endOfMonth
            }
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
    });

    return result.map(r => ({
        merchant: r.merchant!,
        total: Number(r._sum.amount ?? 0)
    }));
}

export const AnalyticsRepository = {
    getMonthlySummary,
    getLastSixMonthsData,
    getTopMerchants
}