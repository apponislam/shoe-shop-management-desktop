import { getPrismaClient } from "../db";

export interface CreatePurchaseInput {
    supplierId: number;
    userId: number;
    subtotal: number;
    discount?: number;
    total: number;
    paidAmount: number;
    dueAmount: number;
    notes?: string;
    items: Array<{
        productId: number;
        variantId: number;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
}

export const purchaseService = {
    getPurchases: async () => {
        const prisma = getPrismaClient();
        return await prisma.purchase.findMany({
            include: {
                supplier: true,
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: true,
                        variant: { include: { size: true, color: true } },
                    },
                },
                payments: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },

    getPurchaseById: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.purchase.findUnique({
            where: { id },
            include: {
                supplier: true,
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: true,
                        variant: { include: { size: true, color: true } },
                    },
                },
                payments: true,
            },
        });
    },

    createPurchase: async (input: CreatePurchaseInput) => {
        const prisma = getPrismaClient();
        return await prisma.$transaction(async (tx) => {
            const count = await tx.purchase.count();
            const invoiceNumber = `PUR-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(4, "0")}`;

            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber,
                    supplierId: input.supplierId,
                    userId: input.userId,
                    subtotal: input.subtotal,
                    discount: input.discount || 0,
                    total: input.total,
                    paidAmount: input.paidAmount,
                    dueAmount: input.dueAmount,
                    status: input.dueAmount > 0 ? (input.paidAmount > 0 ? "PARTIAL" : "RECEIVED") : "RECEIVED",
                    notes: input.notes,
                },
            });

            for (const item of input.items) {
                await tx.purchaseItem.create({
                    data: {
                        purchaseId: purchase.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total,
                    },
                });

                // Update variant stock & purchase price
                const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } });
                const prevStock = variant.stock;
                const newStock = prevStock + item.quantity;

                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: newStock,
                        purchasePrice: item.unitPrice,
                    },
                });

                // Record stock movement
                await tx.stockMovement.create({
                    data: {
                        variantId: item.variantId,
                        userId: input.userId,
                        type: "PURCHASE",
                        quantity: item.quantity,
                        previousStock: prevStock,
                        newStock,
                        reference: invoiceNumber,
                        notes: `Purchase from supplier #${input.supplierId}`,
                    },
                });
            }

            if (input.paidAmount > 0) {
                await tx.payment.create({
                    data: {
                        purchaseId: purchase.id,
                        amount: input.paidAmount,
                        method: "CASH",
                        reference: invoiceNumber,
                        notes: "Initial purchase payment",
                    },
                });
            }

            return purchase;
        });
    },
};
