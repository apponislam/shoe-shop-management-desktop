import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        let dbPath: string;

        if (app && app.isPackaged) {
            const userDataPath = app.getPath("userData");
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            dbPath = path.join(userDataPath, "shoe_shop.db");

            if (!fs.existsSync(dbPath)) {
                const defaultDbPath = path.join(app.getAppPath(), "dev.db");
                if (fs.existsSync(defaultDbPath)) {
                    fs.copyFileSync(defaultDbPath, dbPath);
                } else {
                    // Create empty file if seed db missing
                    fs.writeFileSync(dbPath, "");
                }
            }
        } else {
            dbPath = path.resolve(process.cwd(), "dev.db");
        }

        const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
        prisma = new PrismaClient({ adapter });

        // Ensure at least one system user exists for foreign key constraints
        prisma.user.findFirst().then((existingUser) => {
            if (!existingUser) {
                prisma.user.create({
                    data: {
                        name: "System Admin",
                        username: "admin",
                        passwordHash: "admin",
                        role: "ADMIN",
                    },
                }).catch((err) => console.error("Error creating default user:", err));
            }
        }).catch((err) => console.error("Error checking user table:", err));
    }

    return prisma;
}
