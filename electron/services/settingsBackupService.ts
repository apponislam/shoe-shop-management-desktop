import fs from "fs";
import path from "path";
import { app, dialog } from "electron";
import { getPrismaClient } from "../db";

const getSettingsFilePath = () => {
    if (app && app.isPackaged) {
        return path.join(app.getPath("userData"), "settings.json");
    }
    return path.join(process.cwd(), "settings.json");
};

const defaultSettings = {
    shopName: "Shoe Shop Management",
    address: "123 Commercial Street, Dhaka",
    phone: "+880 1700-000000",
    email: "info@stepstyleshoes.com",
    currency: "BDT",
    currencySymbol: "৳",
    defaultReceiptFormat: "80mm",
    invoicePrefix: "INV-",
};

export const settingsBackupService = {
    getSettings: async () => {
        const file = getSettingsFilePath();
        if (fs.existsSync(file)) {
            try {
                const data = JSON.parse(fs.readFileSync(file, "utf-8"));
                return { ...defaultSettings, ...data };
            } catch {
                return defaultSettings;
            }
        }
        return defaultSettings;
    },

    saveSettings: async (settings: Partial<typeof defaultSettings>) => {
        const file = getSettingsFilePath();
        const current = await settingsBackupService.getSettings();
        const updated = { ...current, ...settings };
        fs.writeFileSync(file, JSON.stringify(updated, null, 2), "utf-8");
        return updated;
    },

    backupDatabase: async (targetPath?: string) => {
        let dbPath: string;
        if (app && app.isPackaged) {
            dbPath = path.join(app.getPath("userData"), "shoe_shop.db");
        } else {
            dbPath = path.resolve(process.cwd(), "dev.db");
        }

        if (!fs.existsSync(dbPath)) {
            throw new Error("Database file does not exist to backup.");
        }

        let destination = targetPath;
        if (!destination) {
            const dateStr = new Date().toISOString().slice(0, 10);
            const defaultName = `shoe-shop-backup-${dateStr}.db`;

            const { filePath } = await dialog.showSaveDialog({
                title: "Save Database Backup",
                defaultPath: defaultName,
                filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
            });

            if (!filePath) return { success: false, message: "Backup cancelled" };
            destination = filePath;
        }

        fs.copyFileSync(dbPath, destination);
        return { success: true, path: destination };
    },

    restoreDatabase: async (sourcePath?: string) => {
        let fileToRestore = sourcePath;

        if (!fileToRestore) {
            const { filePaths } = await dialog.showOpenDialog({
                title: "Select Database Backup File to Restore",
                properties: ["openFile"],
                filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
            });

            if (!filePaths || filePaths.length === 0) return { success: false, message: "Restore cancelled" };
            fileToRestore = filePaths[0];
        }

        let dbPath: string;
        if (app && app.isPackaged) {
            dbPath = path.join(app.getPath("userData"), "shoe_shop.db");
        } else {
            dbPath = path.resolve(process.cwd(), "dev.db");
        }

        // Create a safety backup before overwriting
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, `${dbPath}.bak`);
        }

        fs.copyFileSync(fileToRestore, dbPath);
        return { success: true, message: "Database restored successfully. Please restart the application." };
    },
};
