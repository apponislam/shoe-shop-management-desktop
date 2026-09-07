import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { masterDataService } from "./services/masterDataService";
import { productService } from "./services/productService";
import { stockService } from "./services/stockService";
import { purchaseService } from "./services/purchaseService";
import { saleService } from "./services/saleService";
import { customerSupplierService } from "./services/customerSupplierService";
import { expenseService } from "./services/expenseService";
import { reportService } from "./services/reportService";
import { settingsBackupService } from "./services/settingsBackupService";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    const preloadPath = fs.existsSync(path.join(__dirname, "preload.cjs"))
        ? path.join(__dirname, "preload.cjs")
        : path.join(__dirname, "preload.js");

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        title: "Shoe Shop Management System",
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false,
        },
    });

    const indexPath = app.isPackaged
        ? path.join(app.getAppPath(), "dist/index.html")
        : path.join(__dirname, "../dist/index.html");

    if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
    } else if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadURL("http://localhost:5173");
    }
};

const setupIPCHandlers = () => {
    // Master Data
    ipcMain.handle("categories:get", () => masterDataService.getCategories());
    ipcMain.handle("categories:create", (_, data) => masterDataService.createCategory(data));
    ipcMain.handle("categories:update", (_, id, data) => masterDataService.updateCategory(id, data));
    ipcMain.handle("categories:delete", (_, id) => masterDataService.deleteCategory(id));

    ipcMain.handle("brands:get", () => masterDataService.getBrands());
    ipcMain.handle("brands:create", (_, data) => masterDataService.createBrand(data));
    ipcMain.handle("brands:update", (_, id, data) => masterDataService.updateBrand(id, data));
    ipcMain.handle("brands:delete", (_, id) => masterDataService.deleteBrand(id));

    ipcMain.handle("sizes:get", () => masterDataService.getSizes());
    ipcMain.handle("sizes:create", (_, data) => masterDataService.createSize(data));
    ipcMain.handle("sizes:update", (_, id, data) => masterDataService.updateSize(id, data));
    ipcMain.handle("sizes:delete", (_, id) => masterDataService.deleteSize(id));

    ipcMain.handle("colors:get", () => masterDataService.getColors());
    ipcMain.handle("colors:create", (_, data) => masterDataService.createColor(data));
    ipcMain.handle("colors:update", (_, id, data) => masterDataService.updateColor(id, data));
    ipcMain.handle("colors:delete", (_, id) => masterDataService.deleteColor(id));

    ipcMain.handle("users:get", () => masterDataService.getUsers());
    ipcMain.handle("users:create", (_, data) => masterDataService.createUser(data));

    // Products
    ipcMain.handle("products:get", (_, params) => productService.getProducts(params));
    ipcMain.handle("products:getById", (_, id) => productService.getProductById(id));
    ipcMain.handle("products:findVariant", (_, code) => productService.findVariantByBarcodeOrSku(code));
    ipcMain.handle("products:create", (_, input) => productService.createProduct(input));
    ipcMain.handle("products:update", (_, id, data) => productService.updateProduct(id, data));
    ipcMain.handle("products:delete", (_, id) => productService.deleteProduct(id));
    ipcMain.handle("products:addVariant", (_, productId, variant) => productService.addVariant(productId, variant));
    ipcMain.handle("products:updateVariant", (_, variantId, data) => productService.updateVariant(variantId, data));
    ipcMain.handle("products:deleteVariant", (_, variantId) => productService.deleteVariant(variantId));

    // Stock
    ipcMain.handle("stock:getMovements", (_, params) => stockService.getStockMovements(params));
    ipcMain.handle("stock:getLowStock", () => stockService.getLowStockVariants());
    ipcMain.handle("stock:adjust", (_, input) => stockService.adjustStock(input));
    ipcMain.handle("stock:getValuation", () => stockService.getStockValuation());

    // Purchases
    ipcMain.handle("purchases:get", () => purchaseService.getPurchases());
    ipcMain.handle("purchases:getById", (_, id) => purchaseService.getPurchaseById(id));
    ipcMain.handle("purchases:create", (_, input) => purchaseService.createPurchase(input));

    // Sales / POS
    ipcMain.handle("sales:get", (_, params) => saleService.getSales(params));
    ipcMain.handle("sales:getById", (_, id) => saleService.getSaleById(id));
    ipcMain.handle("sales:create", (_, input) => saleService.createSale(input));

    // Customers & Suppliers
    ipcMain.handle("customers:get", (_, search) => customerSupplierService.getCustomers(search));
    ipcMain.handle("customers:create", (_, data) => customerSupplierService.createCustomer(data));
    ipcMain.handle("customers:update", (_, id, data) => customerSupplierService.updateCustomer(id, data));
    ipcMain.handle("customers:delete", (_, id) => customerSupplierService.deleteCustomer(id));

    ipcMain.handle("suppliers:get", (_, search) => customerSupplierService.getSuppliers(search));
    ipcMain.handle("suppliers:create", (_, data) => customerSupplierService.createSupplier(data));
    ipcMain.handle("suppliers:update", (_, id, data) => customerSupplierService.updateSupplier(id, data));
    ipcMain.handle("suppliers:delete", (_, id) => customerSupplierService.deleteSupplier(id));

    // Expenses
    ipcMain.handle("expenses:get", (_, params) => expenseService.getExpenses(params));
    ipcMain.handle("expenses:create", (_, input) => expenseService.createExpense(input));
    ipcMain.handle("expenses:delete", (_, id) => expenseService.deleteExpense(id));

    // Reports
    ipcMain.handle("reports:getDashboardStats", () => reportService.getDashboardStats());
    ipcMain.handle("reports:getProfitAndLoss", (_, params) => reportService.getProfitAndLossReport(params));

    // Settings & Backup
    ipcMain.handle("settings:get", () => settingsBackupService.getSettings());
    ipcMain.handle("settings:save", (_, settings) => settingsBackupService.saveSettings(settings));
    ipcMain.handle("backup:export", () => settingsBackupService.backupDatabase());
    ipcMain.handle("backup:import", () => settingsBackupService.restoreDatabase());
};

app.whenReady().then(() => {
    setupIPCHandlers();
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
