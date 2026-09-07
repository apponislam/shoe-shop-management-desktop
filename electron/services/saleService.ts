import { getPrismaClient } from "../db";

export interface CreateSaleInput {
    customerId?: number;
    userId: number;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    paidAmount: number;
    dueAmount: number;
    changeAmount: number;
    paymentMethod: "CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER" | "OTHER";
    notes?: string;
    items: Array<{
        productId: number;
        variantId: number;
        quantity: number;
        unitPrice: number;
        discount?: number;
        total: number;
    }>;
}

export const saleService = {
    getSales: async (params?: { startDate?: string; endDate?: string; customerId?: number }) => {
        const prisma = getPrismaClient();
        const where: any = {};

        if (params?.customerId) where.customerId = params.customerId;
        if (params?.startDate || params?.endDate) {
            where.soldAt = {};
            if (params?.startDate) where.soldAt.gte = new Date(params.startDate);
            if (params?.endDate) where.soldAt.lte = new Date(params.endDate);
        }

        return await prisma.sale.findMany({
            where,
            include: {
                customer: true,
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: true,
                        variant: { include: { size: true, color: true } },
                    },
                },
                payments: true,
            },
            orderBy: { soldAt: "desc" },
        });
    },

    getSaleById: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
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

    createSale: async (input: CreateSaleInput) => {
        const prisma = getPrismaClient();
        return await prisma.$transaction(async (tx) => {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const count = await tx.sale.count();
            const invoiceNumber = `INV-${dateStr}-${(count + 1).toString().padStart(4, "0")}`;

            const paymentStatus = input.dueAmount <= 0 ? "PAID" : input.paidAmount > 0 ? "PARTIAL" : "UNPAID";

            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    customerId: input.customerId,
                    userId: input.userId,
                    subtotal: input.subtotal,
                    discount: input.discount || 0,
                    tax: input.tax || 0,
                    total: input.total,
                    paidAmount: input.paidAmount,
                    dueAmount: input.dueAmount,
                    changeAmount: input.changeAmount,
                    paymentMethod: input.paymentMethod,
                    paymentStatus,
                    status: "COMPLETED",
                    notes: input.notes,
                },
            });

            for (const item of input.items) {
                await tx.saleItem.create({
                    data: {
                        saleId: sale.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount || 0,
                        total: item.total,
                    },
                });

                // Update stock safely
                const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } });
                const prevStock = variant.stock;
                const newStock = Math.max(0, prevStock - item.quantity);

                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: newStock },
                });

                // Record stock movement
                await tx.stockMovement.create({
                    data: {
                        variantId: item.variantId,
                        userId: input.userId,
                        type: "SALE",
                        quantity: item.quantity,
                        previousStock: prevStock,
                        newStock,
                        reference: invoiceNumber,
                        notes: `Sale #${invoiceNumber}`,
                    },
                });
            }

            // Record initial payment
            if (input.paidAmount > 0) {
                await tx.payment.create({
                    data: {
                        saleId: sale.id,
                        amount: input.paidAmount,
                        method: input.paymentMethod,
                        reference: invoiceNumber,
                        notes: "POS checkout payment",
                    },
                });
            }

            return sale;
        });
    },
};
