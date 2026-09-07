import { getPrismaClient } from "../db";

export const masterDataService = {
    // Categories
    getCategories: async () => {
        const prisma = getPrismaClient();
        return await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { products: true } } },
        });
    },
    createCategory: async (data: { name: string; description?: string }) => {
        const prisma = getPrismaClient();
        return await prisma.category.create({ data });
    },
    updateCategory: async (id: number, data: { name?: string; description?: string; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.category.update({ where: { id }, data });
    },
    deleteCategory: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.category.delete({ where: { id } });
    },

    // Brands
    getBrands: async () => {
        const prisma = getPrismaClient();
        return await prisma.brand.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { products: true } } },
        });
    },
    createBrand: async (data: { name: string; description?: string }) => {
        const prisma = getPrismaClient();
        return await prisma.brand.create({ data });
    },
    updateBrand: async (id: number, data: { name?: string; description?: string; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.brand.update({ where: { id }, data });
    },
    deleteBrand: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.brand.delete({ where: { id } });
    },

    // Sizes
    getSizes: async () => {
        const prisma = getPrismaClient();
        return await prisma.size.findMany({ orderBy: { sortOrder: "asc" } });
    },
    createSize: async (data: { name: string; sortOrder?: number }) => {
        const prisma = getPrismaClient();
        return await prisma.size.create({ data });
    },
    updateSize: async (id: number, data: { name?: string; sortOrder?: number; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.size.update({ where: { id }, data });
    },
    deleteSize: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.size.delete({ where: { id } });
    },

    // Colors
    getColors: async () => {
        const prisma = getPrismaClient();
        return await prisma.color.findMany({ orderBy: { name: "asc" } });
    },
    createColor: async (data: { name: string; hexCode?: string }) => {
        const prisma = getPrismaClient();
        return await prisma.color.create({ data });
    },
    updateColor: async (id: number, data: { name?: string; hexCode?: string; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.color.update({ where: { id }, data });
    },
    deleteColor: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.color.delete({ where: { id } });
    },

    // Users
    getUsers: async () => {
        const prisma = getPrismaClient();
        return await prisma.user.findMany({
            select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
        });
    },
    createUser: async (data: { name: string; username: string; passwordHash: string; role?: "ADMIN" | "MANAGER" | "CASHIER" }) => {
        const prisma = getPrismaClient();
        return await prisma.user.create({ data });
    },
};
