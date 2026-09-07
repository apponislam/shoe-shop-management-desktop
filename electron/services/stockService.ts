import { getPrismaClient } from "../db";

export interface StockAdjustmentInput {
    variantId: number;
    userId: number;
    type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "DAMAGE";
    quantity: number;
    notes?: string;
}

export const stockService = {
    getStockMovements: async (params?: { variantId?: number; limit?: number }) => {
        const prisma = getPrismaClient();
        return await prisma.stockMovement.findMany({
            where: params?.variantId ? { variantId: params.variantId } : undefined,
            include: {
                variant: {
                    include: {
                        product: true,
                        size: true,
                        color: true,
                    },
                },
                user: { select: { id: true, name: true, username: true } },
            },
            orderBy: { createdAt: "desc" },
            take: params?.limit || 100,
        });
    },

    getLowStockVariants: async () => {
        const prisma = getPrismaClient();
        const allVariants = await prisma.productVariant.findMany({
            where: { isActive: true },
            include: {
                product: { include: { category: true, brand: true } },
                size: true,
                color: true,
            },
        });

        return allVariants.filter((v) => v.stock <= v.minimumStock);
    },

    adjustStock: async (input: StockAdjustmentInput) => {
        const prisma = getPrismaClient();
        return await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: input.variantId } });

            const prevStock = variant.stock;
            let newStock = prevStock;

            if (input.type === "ADJUSTMENT_IN") {
                newStock += input.quantity;
            } else {
                newStock -= input.quantity;
                if (newStock < 0) newStock = 0;
            }

            await tx.productVariant.update({
                where: { id: input.variantId },
                data: { stock: newStock },
            });

            return await tx.stockMovement.create({
                data: {
                    variantId: input.variantId,
                    userId: input.userId,
                    type: input.type,
                    quantity: input.quantity,
                    previousStock: prevStock,
                    newStock,
                    notes: input.notes,
                },
            });
        });
    },

    getStockValuation: async () => {
        const prisma = getPrismaClient();
        const variants = await prisma.productVariant.findMany({
            where: { isActive: true },
        });

        let totalPurchaseValuation = 0;
        let totalSellingValuation = 0;
        let totalQuantity = 0;

        for (const v of variants) {
            totalQuantity += v.stock;
            totalPurchaseValuation += Number(v.purchasePrice) * v.stock;
            totalSellingValuation += Number(v.sellingPrice) * v.stock;
        }

        return {
            totalVariants: variants.length,
            totalQuantity,
            totalPurchaseValuation,
            totalSellingValuation,
            potentialProfit: totalSellingValuation - totalPurchaseValuation,
        };
    },
};
