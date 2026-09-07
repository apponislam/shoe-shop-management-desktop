import { contextBridge, ipcRenderer } from "electron";

export const electronAPI = {
    // Master Data
    getCategories: () => ipcRenderer.invoke("categories:get"),
    createCategory: (data: any) => ipcRenderer.invoke("categories:create", data),
    updateCategory: (id: number, data: any) => ipcRenderer.invoke("categories:update", id, data),
    deleteCategory: (id: number) => ipcRenderer.invoke("categories:delete", id),

    getBrands: () => ipcRenderer.invoke("brands:get"),
    createBrand: (data: any) => ipcRenderer.invoke("brands:create", data),
    updateBrand: (id: number, data: any) => ipcRenderer.invoke("brands:update", id, data),
    deleteBrand: (id: number) => ipcRenderer.invoke("brands:delete", id),

    getSizes: () => ipcRenderer.invoke("sizes:get"),
    createSize: (data: any) => ipcRenderer.invoke("sizes:create", data),
    updateSize: (id: number, data: any) => ipcRenderer.invoke("sizes:update", id, data),
    deleteSize: (id: number) => ipcRenderer.invoke("sizes:delete", id),

    getColors: () => ipcRenderer.invoke("colors:get"),
    createColor: (data: any) => ipcRenderer.invoke("colors:create", data),
    updateColor: (id: number, data: any) => ipcRenderer.invoke("colors:update", id, data),
    deleteColor: (id: number) => ipcRenderer.invoke("colors:delete", id),

    getUsers: () => ipcRenderer.invoke("users:get"),
    createUser: (data: any) => ipcRenderer.invoke("users:create", data),

    // Products
    getProducts: (params?: any) => ipcRenderer.invoke("products:get", params),
    getProductById: (id: number) => ipcRenderer.invoke("products:getById", id),
    findVariantByBarcodeOrSku: (code: string) => ipcRenderer.invoke("products:findVariant", code),
    createProduct: (input: any) => ipcRenderer.invoke("products:create", input),
    updateProduct: (id: number, data: any) => ipcRenderer.invoke("products:update", id, data),
    deleteProduct: (id: number) => ipcRenderer.invoke("products:delete", id),
    addVariant: (productId: number, variant: any) => ipcRenderer.invoke("products:addVariant", productId, variant),
    updateVariant: (variantId: number, data: any) => ipcRenderer.invoke("products:updateVariant", variantId, data),
    deleteVariant: (variantId: number) => ipcRenderer.invoke("products:deleteVariant", variantId),

    // Stock
    getStockMovements: (params?: any) => ipcRenderer.invoke("stock:getMovements", params),
    getLowStockVariants: () => ipcRenderer.invoke("stock:getLowStock"),
    adjustStock: (input: any) => ipcRenderer.invoke("stock:adjust", input),
    getStockValuation: () => ipcRenderer.invoke("stock:getValuation"),

    // Purchases
    getPurchases: () => ipcRenderer.invoke("purchases:get"),
    getPurchaseById: (id: number) => ipcRenderer.invoke("purchases:getById", id),
    createPurchase: (input: any) => ipcRenderer.invoke("purchases:create", input),

    // Sales / POS
    getSales: (params?: any) => ipcRenderer.invoke("sales:get", params),
    getSaleById: (id: number) => ipcRenderer.invoke("sales:getById", id),
    createSale: (input: any) => ipcRenderer.invoke("sales:create", input),

    // Customers & Suppliers
    getCustomers: (search?: string) => ipcRenderer.invoke("customers:get", search),
    createCustomer: (data: any) => ipcRenderer.invoke("customers:create", data),
    updateCustomer: (id: number, data: any) => ipcRenderer.invoke("customers:update", id, data),
    deleteCustomer: (id: number) => ipcRenderer.invoke("customers:delete", id),

    getSuppliers: (search?: string) => ipcRenderer.invoke("suppliers:get", search),
    createSupplier: (data: any) => ipcRenderer.invoke("suppliers:create", data),
    updateSupplier: (id: number, data: any) => ipcRenderer.invoke("suppliers:update", id, data),
    deleteSupplier: (id: number) => ipcRenderer.invoke("suppliers:delete", id),

    // Expenses
    getExpenses: (params?: any) => ipcRenderer.invoke("expenses:get", params),
    createExpense: (input: any) => ipcRenderer.invoke("expenses:create", input),
    deleteExpense: (id: number) => ipcRenderer.invoke("expenses:delete", id),

    // Reports
    getDashboardStats: () => ipcRenderer.invoke("reports:getDashboardStats"),
    getProfitAndLossReport: (params?: any) => ipcRenderer.invoke("reports:getProfitAndLoss", params),

    // Settings & Backup
    getSettings: () => ipcRenderer.invoke("settings:get"),
    saveSettings: (settings: any) => ipcRenderer.invoke("settings:save", settings),
    backupDatabase: () => ipcRenderer.invoke("backup:export"),
    restoreDatabase: () => ipcRenderer.invoke("backup:import"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
