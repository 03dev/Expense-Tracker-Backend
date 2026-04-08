import { prisma } from "../config/prisma";

const dashboardData = async (userId: string) => {

    const [income, expense, transactions] = await prisma.$transaction([
        prisma.transaction.aggregate({
            where: {
                userId,
                type: "INCOME",
                deletedAt: null
            },
            _sum: {
                amount: true
            }
        }),
        prisma.transaction.aggregate({
            where: {
                userId,
                type: "EXPENSE",
                deletedAt: null
            },
            _sum: {
                amount: true
            }
        }),
        prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null
            },
            orderBy: {
                date: 'desc'
            },
            take: 5,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
    ]);

    return {
        income: Number(income._sum.amount ?? 0),
        expense: Number(expense._sum.amount ?? 0),
        transactions
    }
}

export const DashboardRespository = {
    dashboardData
}