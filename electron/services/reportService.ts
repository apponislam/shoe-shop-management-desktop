import { getPrismaClient } from "../db";

export const reportService = {
    getDashboardStats: async () => {
        const prisma = getPrismaClient();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Today's Sales
        const todaySales = await prisma.sale.aggregate({
            where: { soldAt: { gte: todayStart, lte: todayEnd }, status: "COMPLETED" },
            _sum: { total: true, paidAmount: true, dueAmount: true },
            _count: { id: true },
        });

        // Today's Purchases
        const todayPurchases = await prisma.purchase.aggregate({
            where: { purchasedAt: { gte: todayStart, lte: todayEnd } },
            _sum: { total: true, paidAmount: true, dueAmount: true },
            _count: { id: true },
        });

        // Today's Expenses
        const todayExpenses = await prisma.expense.aggregate({
            where: { expenseDate: { gte: todayStart, lte: todayEnd } },
            _sum: { amount: true },
        });

        // Totals
        const totalProducts = await prisma.product.count({ where: { isActive: true } });
        const variants = await prisma.productVariant.findMany({ where: { isActive: true } });

        let totalStock = 0;
        let lowStockCount = 0;
        for (const v of variants) {
            totalStock += v.stock;
            if (v.stock <= v.minimumStock) lowStockCount++;
        }

        // Dues
        const customerDues = await prisma.sale.aggregate({
            where: { dueAmount: { gt: 0 } },
            _sum: { dueAmount: true },
        });

        const supplierDues = await prisma.purchase.aggregate({
            where: { dueAmount: { gt: 0 } },
            _sum: { dueAmount: true },
        });

        // Recent Sales
        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: { soldAt: "desc" },
            include: { customer: true, user: { select: { name: true } } },
        });

        return {
            todaySalesTotal: Number(todaySales._sum.total || 0),
            todaySalesCount: todaySales._count.id || 0,
            todayPurchasesTotal: Number(todayPurchases._sum.total || 0),
            todayExpensesTotal: Number(todayExpenses._sum.amount || 0),
            totalProducts,
            totalStock,
            lowStockCount,
            totalCustomerDue: Number(customerDues._sum.dueAmount || 0),
            totalSupplierDue: Number(supplierDues._sum.dueAmount || 0),
            recentSales,
        };
    },

    getProfitAndLossReport: async (params?: { startDate?: string; endDate?: string }) => {
        const prisma = getPrismaClient();
        const saleWhere: any = { status: "COMPLETED" };
        const expenseWhere: any = {};

        if (params?.startDate || params?.endDate) {
            saleWhere.soldAt = {};
            expenseWhere.expenseDate = {};
            if (params?.startDate) {
                const s = new Date(params.startDate);
                saleWhere.soldAt.gte = s;
                expenseWhere.expenseDate.gte = s;
            }
            if (params?.endDate) {
                const e = new Date(params.endDate);
                saleWhere.soldAt.lte = e;
                expenseWhere.expenseDate.lte = e;
            }
        }

        // Fetch sales with items & variant purchase price for COGS calculation
        const sales = await prisma.sale.findMany({
            where: saleWhere,
            include: {
                items: {
                    include: { variant: true },
                },
            },
        });

        let totalRevenue = 0;
        let totalDiscountGiven = 0;
        let totalCOGS = 0;

        for (const s of sales) {
            totalRevenue += Number(s.total);
            totalDiscountGiven += Number(s.discount);
            for (const item of s.items) {
                const cogsPerItem = Number(item.variant.purchasePrice) * item.quantity;
                totalCOGS += cogsPerItem;
            }
        }

        const expenses = await prisma.expense.aggregate({
            where: expenseWhere,
            _sum: { amount: true },
        });
        const totalExpenses = Number(expenses._sum.amount || 0);

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        return {
            totalRevenue,
            totalDiscountGiven,
            totalCOGS,
            grossProfit,
            totalExpenses,
            netProfit,
        };
    },
};
