import { getPrismaClient } from "../db";

export const customerSupplierService = {
    // Customers
    getCustomers: async (search?: string) => {
        const prisma = getPrismaClient();
        const where: any = { isActive: true };
        if (search) {
            where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
        }
        return await prisma.customer.findMany({
            where,
            include: {
                sales: { select: { id: true, total: true, paidAmount: true, dueAmount: true, soldAt: true } },
            },
            orderBy: { name: "asc" },
        });
    },

    createCustomer: async (data: { name: string; phone?: string; email?: string; address?: string; openingDue?: number }) => {
        const prisma = getPrismaClient();
        return await prisma.customer.create({ data });
    },

    updateCustomer: async (id: number, data: { name?: string; phone?: string; email?: string; address?: string; openingDue?: number; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.customer.update({ where: { id }, data });
    },

    deleteCustomer: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.customer.delete({ where: { id } });
    },

    // Suppliers
    getSuppliers: async (search?: string) => {
        const prisma = getPrismaClient();
        const where: any = { isActive: true };
        if (search) {
            where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
        }
        return await prisma.supplier.findMany({
            where,
            include: {
                purchases: { select: { id: true, total: true, paidAmount: true, dueAmount: true, purchasedAt: true } },
            },
            orderBy: { name: "asc" },
        });
    },

    createSupplier: async (data: { name: string; phone?: string; email?: string; address?: string; openingDue?: number }) => {
        const prisma = getPrismaClient();
        return await prisma.supplier.create({ data });
    },

    updateSupplier: async (id: number, data: { name?: string; phone?: string; email?: string; address?: string; openingDue?: number; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.supplier.update({ where: { id }, data });
    },

    deleteSupplier: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.supplier.delete({ where: { id } });
    },
};
