import { getPrismaClient } from "../db";

export interface CreateExpenseInput {
    title: string;
    description?: string;
    category: "RENT" | "SALARY" | "ELECTRICITY" | "INTERNET" | "TRANSPORT" | "MARKETING" | "MAINTENANCE" | "OTHER";
    amount: number;
    paymentMethod: "CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER" | "OTHER";
    userId: number;
    expenseDate?: string;
}

export const expenseService = {
    getExpenses: async (params?: { category?: string; startDate?: string; endDate?: string }) => {
        const prisma = getPrismaClient();
        const where: any = {};

        if (params?.category) where.category = params.category;
        if (params?.startDate || params?.endDate) {
            where.expenseDate = {};
            if (params?.startDate) where.expenseDate.gte = new Date(params.startDate);
            if (params?.endDate) where.expenseDate.lte = new Date(params.endDate);
        }

        return await prisma.expense.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
            orderBy: { expenseDate: "desc" },
        });
    },

    createExpense: async (input: CreateExpenseInput) => {
        const prisma = getPrismaClient();
        return await prisma.expense.create({
            data: {
                title: input.title,
                description: input.description,
                category: input.category,
                amount: input.amount,
                paymentMethod: input.paymentMethod,
                userId: input.userId,
                expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
            },
        });
    },

    deleteExpense: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.expense.delete({ where: { id } });
    },
};
