import { getPrismaClient } from "../db";

export interface CreateProductInput {
    name: string;
    description?: string;
    sku?: string;
    image?: string;
    categoryId: number;
    brandId?: number;
    variants: Array<{
        sizeId?: number;
        colorId?: number;
        sku: string;
        barcode?: string;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minimumStock: number;
    }>;
}

export const productService = {
    getProducts: async (params?: { categoryId?: number; brandId?: number; search?: string }) => {
        const prisma = getPrismaClient();
        const where: any = {};

        if (params?.categoryId) where.categoryId = params.categoryId;
        if (params?.brandId) where.brandId = params.brandId;
        if (params?.search) {
            where.OR = [
                { name: { contains: params.search } },
                { sku: { contains: params.search } },
                { variants: { some: { barcode: { contains: params.search } } } },
                { variants: { some: { sku: { contains: params.search } } } },
            ];
        }

        return await prisma.product.findMany({
            where,
            include: {
                category: true,
                brand: true,
                variants: {
                    include: {
                        size: true,
                        color: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
    },

    getProductById: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                brand: true,
                variants: {
                    include: {
                        size: true,
                        color: true,
                    },
                },
            },
        });
    },

    findVariantByBarcodeOrSku: async (code: string) => {
        const prisma = getPrismaClient();
        return await prisma.productVariant.findFirst({
            where: {
                OR: [{ barcode: code }, { sku: code }],
                isActive: true,
            },
            include: {
                product: {
                    include: {
                        category: true,
                        brand: true,
                    },
                },
                size: true,
                color: true,
            },
        });
    },

    createProduct: async (input: CreateProductInput) => {
        const prisma = getPrismaClient();
        return await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: input.name,
                    description: input.description,
                    sku: input.sku,
                    image: input.image,
                    categoryId: input.categoryId,
                    brandId: input.brandId,
                },
            });

            for (const v of input.variants) {
                const variant = await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        sizeId: v.sizeId,
                        colorId: v.colorId,
                        sku: v.sku,
                        barcode: v.barcode,
                        purchasePrice: v.purchasePrice,
                        sellingPrice: v.sellingPrice,
                        stock: v.stock,
                        minimumStock: v.minimumStock,
                    },
                });

                if (v.stock > 0) {
                    let firstUser = await tx.user.findFirst();
                    if (!firstUser) {
                        firstUser = await tx.user.create({
                            data: {
                                name: "System Admin",
                                username: "admin",
                                passwordHash: "admin",
                                role: "ADMIN",
                            },
                        });
                    }

                    await tx.stockMovement.create({
                        data: {
                            variantId: variant.id,
                            userId: firstUser.id,
                            type: "OPENING_STOCK",
                            quantity: v.stock,
                            previousStock: 0,
                            newStock: v.stock,
                            reference: "INITIAL",
                            notes: "Opening stock on product creation",
                        },
                    });
                }
            }

            return product;
        });
    },

    updateProduct: async (id: number, data: { name?: string; description?: string; sku?: string; categoryId?: number; brandId?: number; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.product.update({
            where: { id },
            data,
        });
    },

    addVariant: async (productId: number, v: { sizeId?: number; colorId?: number; sku: string; barcode?: string; purchasePrice: number; sellingPrice: number; stock: number; minimumStock: number }) => {
        const prisma = getPrismaClient();
        return await prisma.productVariant.create({
            data: {
                productId,
                sizeId: v.sizeId,
                colorId: v.colorId,
                sku: v.sku,
                barcode: v.barcode,
                purchasePrice: v.purchasePrice,
                sellingPrice: v.sellingPrice,
                stock: v.stock,
                minimumStock: v.minimumStock,
            },
        });
    },

    updateVariant: async (variantId: number, data: { purchasePrice?: number; sellingPrice?: number; minimumStock?: number; barcode?: string; isActive?: boolean }) => {
        const prisma = getPrismaClient();
        return await prisma.productVariant.update({
            where: { id: variantId },
            data,
        });
    },

    deleteProduct: async (id: number) => {
        const prisma = getPrismaClient();
        return await prisma.product.delete({
            where: { id },
        });
    },

    deleteVariant: async (variantId: number) => {
        const prisma = getPrismaClient();
        return await prisma.productVariant.delete({
            where: { id: variantId },
        });
    },
};
