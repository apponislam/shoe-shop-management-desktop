// Web Browser fallback mock for electronAPI when running outside Electron
const STORAGE_PREFIX = "shoe_shop_mock_";

const getStorageItem = <T>(key: string, defaultValue: T): T => {
    try {
        const data = localStorage.getItem(STORAGE_PREFIX + key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setStorageItem = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (err) {
        console.error("LocalStorage write error:", err);
    }
};

export const initMockElectronAPI = () => {
    if (typeof window === "undefined" || window.electronAPI) {
        return; // Native Electron API is already exposed
    }

    console.warn("Running in Browser mode. Injecting localStorage-backed mock electronAPI.");

    // Initial mock seed data if empty
    if (!localStorage.getItem(STORAGE_PREFIX + "categories")) {
        setStorageItem("categories", [
            { id: 1, name: "Sneakers" },
            { id: 2, name: "Formal" },
            { id: 3, name: "Sandals" },
            { id: 4, name: "Boots" },
        ]);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + "brands")) {
        setStorageItem("brands", [
            { id: 1, name: "Nike" },
            { id: 2, name: "Adidas" },
            { id: 3, name: "Bata" },
            { id: 4, name: "Apex" },
        ]);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + "sizes")) {
        setStorageItem("sizes", [
            { id: 1, name: "39", sortOrder: 39 },
            { id: 2, name: "40", sortOrder: 40 },
            { id: 3, name: "41", sortOrder: 41 },
            { id: 4, name: "42", sortOrder: 42 },
        ]);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + "colors")) {
        setStorageItem("colors", [
            { id: 1, name: "Black", hexCode: "#000000" },
            { id: 2, name: "White", hexCode: "#ffffff" },
            { id: 3, name: "Brown", hexCode: "#8b4513" },
            { id: 4, name: "Navy Blue", hexCode: "#000080" },
        ]);
    }

    window.electronAPI = {
        // Master Data
        getCategories: async () => getStorageItem("categories", []),
        createCategory: async (data: any) => {
            const list = getStorageItem<any[]>("categories", []);
            const newItem = { id: Date.now(), name: data.name };
            list.push(newItem);
            setStorageItem("categories", list);
            return newItem;
        },
        updateCategory: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("categories", []);
            const idx = list.findIndex((c) => c.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("categories", list);
            return list[idx];
        },
        deleteCategory: async (id: number) => {
            let list = getStorageItem<any[]>("categories", []);
            list = list.filter((c) => c.id !== id);
            setStorageItem("categories", list);
            return true;
        },

        getBrands: async () => getStorageItem("brands", []),
        createBrand: async (data: any) => {
            const list = getStorageItem<any[]>("brands", []);
            const newItem = { id: Date.now(), name: data.name };
            list.push(newItem);
            setStorageItem("brands", list);
            return newItem;
        },
        updateBrand: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("brands", []);
            const idx = list.findIndex((b) => b.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("brands", list);
            return list[idx];
        },
        deleteBrand: async (id: number) => {
            let list = getStorageItem<any[]>("brands", []);
            list = list.filter((b) => b.id !== id);
            setStorageItem("brands", list);
            return true;
        },

        getSizes: async () => getStorageItem("sizes", []),
        createSize: async (data: any) => {
            const list = getStorageItem<any[]>("sizes", []);
            const newItem = { id: Date.now(), name: data.name, sortOrder: data.sortOrder || 0 };
            list.push(newItem);
            setStorageItem("sizes", list);
            return newItem;
        },
        updateSize: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("sizes", []);
            const idx = list.findIndex((s) => s.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("sizes", list);
            return list[idx];
        },
        deleteSize: async (id: number) => {
            let list = getStorageItem<any[]>("sizes", []);
            list = list.filter((s) => s.id !== id);
            setStorageItem("sizes", list);
            return true;
        },

        getColors: async () => getStorageItem("colors", []),
        createColor: async (data: any) => {
            const list = getStorageItem<any[]>("colors", []);
            const newItem = { id: Date.now(), name: data.name, hexCode: data.hexCode || "#000000" };
            list.push(newItem);
            setStorageItem("colors", list);
            return newItem;
        },
        updateColor: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("colors", []);
            const idx = list.findIndex((c) => c.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("colors", list);
            return list[idx];
        },
        deleteColor: async (id: number) => {
            let list = getStorageItem<any[]>("colors", []);
            list = list.filter((c) => c.id !== id);
            setStorageItem("colors", list);
            return true;
        },

        getUsers: async () => getStorageItem("users", []),
        createUser: async (data: any) => {
            const list = getStorageItem<any[]>("users", []);
            const newItem = { id: Date.now(), ...data };
            list.push(newItem);
            setStorageItem("users", list);
            return newItem;
        },

        // Products
        getProducts: async (params?: any) => {
            let list = getStorageItem<any[]>("products", []);
            if (params?.search) {
                const q = params.search.toLowerCase();
                list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.modelCode?.toLowerCase().includes(q) || p.variants?.some((v: any) => v.sku?.toLowerCase().includes(q) || v.barcode?.includes(q)));
            }
            return list;
        },
        getProductById: async (id: number) => {
            const list = getStorageItem<any[]>("products", []);
            return list.find((p) => p.id === id) || null;
        },
        findVariantByBarcodeOrSku: async (code: string) => {
            const list = getStorageItem<any[]>("products", []);
            for (const p of list) {
                const variant = p.variants?.find((v: any) => v.barcode === code || v.sku === code);
                if (variant) return { ...variant, product: p };
            }
            return null;
        },
        createProduct: async (input: any) => {
            const list = getStorageItem<any[]>("products", []);
            const newId = Date.now();
            const newProduct = {
                id: newId,
                ...input,
                variants: (input.variants || []).map((v: any, idx: number) => ({
                    id: newId + idx + 1,
                    productId: newId,
                    ...v,
                    stockQuantity: v.stockQuantity || 0,
                })),
            };
            list.push(newProduct);
            setStorageItem("products", list);
            return newProduct;
        },
        updateProduct: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("products", []);
            const idx = list.findIndex((p) => p.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("products", list);
            return list[idx];
        },
        deleteProduct: async (id: number) => {
            let list = getStorageItem<any[]>("products", []);
            list = list.filter((p) => p.id !== id);
            setStorageItem("products", list);
            return true;
        },
        addVariant: async (productId: number, variant: any) => {
            const list = getStorageItem<any[]>("products", []);
            const prod = list.find((p) => p.id === productId);
            if (prod) {
                const newVar = { id: Date.now(), productId, ...variant };
                prod.variants = prod.variants || [];
                prod.variants.push(newVar);
                setStorageItem("products", list);
                return newVar;
            }
            return null;
        },
        updateVariant: async (variantId: number, data: any) => {
            const list = getStorageItem<any[]>("products", []);
            for (const p of list) {
                const vIdx = p.variants?.findIndex((v: any) => v.id === variantId);
                if (vIdx !== undefined && vIdx !== -1) {
                    p.variants[vIdx] = { ...p.variants[vIdx], ...data };
                    setStorageItem("products", list);
                    return p.variants[vIdx];
                }
            }
            return null;
        },
        deleteVariant: async (variantId: number) => {
            const list = getStorageItem<any[]>("products", []);
            for (const p of list) {
                if (p.variants) {
                    p.variants = p.variants.filter((v: any) => v.id !== variantId);
                }
            }
            setStorageItem("products", list);
            return true;
        },

        // Stock
        getStockMovements: async () => getStorageItem("stock_movements", []),
        getLowStockVariants: async () => {
            const list = getStorageItem<any[]>("products", []);
            const lowStock: any[] = [];
            for (const p of list) {
                for (const v of p.variants || []) {
                    if ((v.stockQuantity || 0) <= (v.minAlertThreshold || 3)) {
                        lowStock.push({ ...v, product: p });
                    }
                }
            }
            return lowStock;
        },
        adjustStock: async (input: any) => {
            const list = getStorageItem<any[]>("products", []);
            for (const p of list) {
                const v = p.variants?.find((v: any) => v.id === input.variantId);
                if (v) {
                    v.stockQuantity = (v.stockQuantity || 0) + input.changeQuantity;
                    break;
                }
            }
            setStorageItem("products", list);

            const movements = getStorageItem<any[]>("stock_movements", []);
            const newMovement = { id: Date.now(), createdAt: new Date().toISOString(), ...input };
            movements.unshift(newMovement);
            setStorageItem("stock_movements", movements);
            return newMovement;
        },
        getStockValuation: async () => {
            const list = getStorageItem<any[]>("products", []);
            let totalPairs = 0;
            let totalValue = 0;
            for (const p of list) {
                for (const v of p.variants || []) {
                    const qty = v.stockQuantity || 0;
                    totalPairs += qty;
                    totalValue += qty * (v.purchasePrice || 0);
                }
            }
            return { totalPairs, totalValue, totalModels: list.length };
        },

        // Purchases
        getPurchases: async () => getStorageItem("purchases", []),
        getPurchaseById: async (id: number) => {
            const list = getStorageItem<any[]>("purchases", []);
            return list.find((p) => p.id === id) || null;
        },
        createPurchase: async (input: any) => {
            const list = getStorageItem<any[]>("purchases", []);
            const newPurchase = { id: Date.now(), createdAt: new Date().toISOString(), ...input };
            list.unshift(newPurchase);
            setStorageItem("purchases", list);
            return newPurchase;
        },

        // Sales / POS
        getSales: async () => getStorageItem("sales", []),
        getSaleById: async (id: number) => {
            const list = getStorageItem<any[]>("sales", []);
            return list.find((s) => s.id === id) || null;
        },
        createSale: async (input: any) => {
            const list = getStorageItem<any[]>("sales", []);
            const invoiceNo = "INV-" + Math.floor(100000 + Math.random() * 900000);
            const newSale = { id: Date.now(), invoiceNo, createdAt: new Date().toISOString(), ...input };
            list.unshift(newSale);
            setStorageItem("sales", list);
            return newSale;
        },

        // Customers & Suppliers
        getCustomers: async (search?: string) => {
            let list = getStorageItem<any[]>("customers", []);
            if (search) {
                const q = search.toLowerCase();
                list = list.filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q));
            }
            return list;
        },
        createCustomer: async (data: any) => {
            const list = getStorageItem<any[]>("customers", []);
            const newItem = { id: Date.now(), ...data };
            list.push(newItem);
            setStorageItem("customers", list);
            return newItem;
        },
        updateCustomer: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("customers", []);
            const idx = list.findIndex((c) => c.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("customers", list);
            return list[idx];
        },
        deleteCustomer: async (id: number) => {
            let list = getStorageItem<any[]>("customers", []);
            list = list.filter((c) => c.id !== id);
            setStorageItem("customers", list);
            return true;
        },

        getSuppliers: async (search?: string) => {
            let list = getStorageItem<any[]>("suppliers", []);
            if (search) {
                const q = search.toLowerCase();
                list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.phone?.includes(q));
            }
            return list;
        },
        createSupplier: async (data: any) => {
            const list = getStorageItem<any[]>("suppliers", []);
            const newItem = { id: Date.now(), ...data };
            list.push(newItem);
            setStorageItem("suppliers", list);
            return newItem;
        },
        updateSupplier: async (id: number, data: any) => {
            const list = getStorageItem<any[]>("suppliers", []);
            const idx = list.findIndex((s) => s.id === id);
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            setStorageItem("suppliers", list);
            return list[idx];
        },
        deleteSupplier: async (id: number) => {
            let list = getStorageItem<any[]>("suppliers", []);
            list = list.filter((s) => s.id !== id);
            setStorageItem("suppliers", list);
            return true;
        },

        // Expenses
        getExpenses: async () => getStorageItem("expenses", []),
        createExpense: async (input: any) => {
            const list = getStorageItem<any[]>("expenses", []);
            const newItem = { id: Date.now(), createdAt: new Date().toISOString(), ...input };
            list.unshift(newItem);
            setStorageItem("expenses", list);
            return newItem;
        },
        deleteExpense: async (id: number) => {
            let list = getStorageItem<any[]>("expenses", []);
            list = list.filter((e) => e.id !== id);
            setStorageItem("expenses", list);
            return true;
        },

        // Reports
        getDashboardStats: async () => {
            const sales = getStorageItem<any[]>("sales", []);
            const purchases = getStorageItem<any[]>("purchases", []);
            const products = getStorageItem<any[]>("products", []);

            let todaySalesTotal = 0;
            let todaySalesCount = 0;
            let todayPurchasesTotal = 0;
            let totalPairs = 0;

            sales.forEach((s) => {
                todaySalesTotal += s.totalAmount || 0;
                todaySalesCount += 1;
            });
            purchases.forEach((p) => {
                todayPurchasesTotal += p.totalAmount || 0;
            });
            products.forEach((p) => {
                p.variants?.forEach((v: any) => {
                    totalPairs += v.stockQuantity || 0;
                });
            });

            return {
                todaySalesTotal,
                todaySalesCount,
                todayPurchasesTotal,
                totalPairs,
                activeModelsCount: products.length,
                pendingCustomerDues: 0,
                pendingSupplierDues: 0,
                recentTransactions: sales.slice(0, 10),
            };
        },
        getProfitAndLossReport: async () => {
            const sales = getStorageItem<any[]>("sales", []);
            const expenses = getStorageItem<any[]>("expenses", []);

            const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
            const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
            const cogs = totalRevenue * 0.6; // estimated 60% cost of goods sold
            const netProfit = totalRevenue - cogs - totalExpenses;

            return {
                totalRevenue,
                cogs,
                grossProfit: totalRevenue - cogs,
                totalExpenses,
                netProfit,
            };
        },

        // Settings & Backup
        getSettings: async () =>
            getStorageItem("settings", {
                shopName: "Shoe Shop Management",
                address: "123 Commercial Street, Dhaka",
                phone: "+880 1700-000000",
                email: "info@stepstyleshoes.com",
                currencySymbol: "৳",
                defaultReceiptFormat: "80mm",
            }),
        saveSettings: async (settings: any) => {
            const current = getStorageItem("settings", {});
            const updated = { ...current, ...settings };
            setStorageItem("settings", updated);
            return updated;
        },
        backupDatabase: async () => {
            const backupData: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(STORAGE_PREFIX)) {
                    backupData[k] = localStorage.getItem(k);
                }
            }
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `shoe-shop-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return { success: true, path: "Downloaded in Browser Downloads" };
        },
        restoreDatabase: async () => {
            return new Promise((resolve) => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,.db";
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (!file) {
                        resolve({ success: false, message: "Restore cancelled" });
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target?.result as string);
                            Object.keys(data).forEach((key) => {
                                localStorage.setItem(key, data[key]);
                            });
                            resolve({ success: true, message: "Database restored successfully! Reloading page..." });
                            setTimeout(() => window.location.reload(), 1000);
                        } catch {
                            resolve({ success: false, message: "Invalid backup JSON file" });
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        },
    };
};
