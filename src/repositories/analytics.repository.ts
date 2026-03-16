import { prisma } from "../config/prisma";

const getMonthlySummary = async (userId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const transaction = await prisma.transaction.findMany({
        where: {
            userId,
            deletedAt: null,
            date: {
                gte: startOfMonth,
                lte: endOfMonth,
            }
        },
        include: {
            category: {
                select: {id: true, name: true}
            }
        },
        take: 50,
        skip: 0
    });

    return transaction;
}

const getLastSixMonthsData = async (userId: string) => {
    const months = [];
    const now = new Date();

    for(let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 1);

        const transaction = await prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const income = transaction.reduce((sum, t) => {
            if(t.type === "INCOME" ) {
                return sum + Number(t.amount);
            }
            return sum;
        }, 0);

        const expense = transaction.reduce((sum, t) => {
            if(t.type === "EXPENSE") {
                return sum + Number(t.amount);
            }
            return sum;
        }, 0);

        months.push({
            month,
            year,
            label: date.toLocaleString("default", {month: "short", year: "2-digit"}),
            income,
            expense,
            net: income - expense
        });
    }

    return months
}

const getTopMerchants = async (userId: string, month: number, year: number) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            deletedAt: null,
            type: "EXPENSE",
            merchant: {
                not: null
            },
            date: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        },
        select: {
            merchant: true,
            amount: true
        }
    });

    // group by merchat and sum amounts
    const merchantMap = new Map<string, number>();
    transactions.forEach(t => {
        if(t.merchant) {
            const current = merchantMap.get(t.merchant) ?? 0;
            merchantMap.set(t.merchant, current + Number(t.amount));
        }
    });

    // sort by amount descending
    return Array.from(merchantMap.entries())
        .map(([merchant, total]) => ({merchant, total}))
        .sort((a, b) => b.total - a.total)
        .slice(0,5); // top 5
}

export const AnalyticsRepository = {
    getMonthlySummary,
    getLastSixMonthsData,
    getTopMerchants
}