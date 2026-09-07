import React, { useEffect, useState } from "react";
import { Download, Upload, Save, CheckCircle2 } from "lucide-react";

interface SettingsProps {
    onSettingsSaved: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSettingsSaved }) => {
    const [shopName, setShopName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [currencySymbol, setCurrencySymbol] = useState("৳");
    const [defaultReceiptFormat, setDefaultReceiptFormat] = useState("80mm");
    const [savedMsg, setSavedMsg] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            if (!window.electronAPI) return;
            const s = await window.electronAPI.getSettings();
            if (s) {
                setShopName(s.shopName || "");
                setAddress(s.address || "");
                setPhone(s.phone || "");
                setEmail(s.email || "");
                setCurrencySymbol(s.currencySymbol || "৳");
                setDefaultReceiptFormat(s.defaultReceiptFormat || "80mm");
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
        }
    };

    const handleSaveSettings = async () => {
        try {
            if (!window.electronAPI) {
                alert("Settings feature requires the desktop application runtime.");
                return;
            }
            await window.electronAPI.saveSettings({
                shopName,
                address,
                phone,
                email,
                currencySymbol,
                defaultReceiptFormat,
            });

            setSavedMsg("Settings saved successfully!");
            onSettingsSaved();
            setTimeout(() => setSavedMsg(""), 3000);
        } catch (err: any) {
            alert(`Error saving settings: ${err.message || err}`);
        }
    };

    const handleExportBackup = async () => {
        try {
            if (!window.electronAPI?.backupDatabase) {
                alert("Backup feature requires running in the desktop application.");
                return;
            }
            const res = await window.electronAPI.backupDatabase();
            if (res?.success) {
                alert(`Database backup exported successfully to:\n${res.path}`);
            } else if (res?.message && res.message !== "Backup cancelled") {
                alert(`Backup failed: ${res.message}`);
            }
        } catch (err: any) {
            alert(`Backup failed: ${err.message || err}`);
        }
    };

    const handleImportRestore = async () => {
        if (!window.electronAPI?.restoreDatabase) {
            alert("Restore feature requires running in the desktop application.");
            return;
        }
        if (confirm("Restoring a database will replace all current data. Are you sure you want to proceed?")) {
            try {
                const res = await window.electronAPI.restoreDatabase();
                if (res?.success) {
                    alert(res.message);
                } else if (res?.message && res.message !== "Restore cancelled") {
                    alert(`Restore failed: ${res.message}`);
                }
            } catch (err: any) {
                alert(`Restore failed: ${err.message || err}`);
            }
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Database Backup</h1>
                <p className="text-sm text-slate-400">Configure receipt headers, local currency, and database export/import</p>
            </div>

            {savedMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savedMsg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shop Profile Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h2 className="font-bold text-white text-base">Shop Profile & Invoice Header</h2>

                    <div>
                        <label className="text-xs text-slate-400">Shoe Shop Name *</label>
                        <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-400">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Currency Symbol</label>
                            <input
                                type="text"
                                value={currencySymbol}
                                onChange={(e) => setCurrencySymbol(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1 font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Physical Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Default Receipt Printing Format</label>
                        <select
                            value={defaultReceiptFormat}
                            onChange={(e) => setDefaultReceiptFormat(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-lg text-sm mt-1"
                        >
                            <option value="80mm">80mm Thermal Paper</option>
                            <option value="58mm">58mm Small Thermal Paper</option>
                            <option value="A4">A4 Full Page Invoice</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                        <Save className="w-4 h-4" /> Save Profile Settings
                    </button>
                </div>

                {/* Database Backup & Restore */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h2 className="font-bold text-white text-base">Offline Database Backup & Restore</h2>
                    <p className="text-xs text-slate-400">
                        Export your SQLite database file (`dev.db` / `shoe_shop.db`) for safekeeping or restore from a previous backup file.
                    </p>

                    <div className="space-y-3 pt-2">
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                            <div className="font-semibold text-sm text-white flex items-center gap-2">
                                <Download className="w-4 h-4 text-emerald-400" /> Export Database Backup
                            </div>
                            <p className="text-xs text-slate-400">Saves a complete snapshot of all products, sales, stock, and customer ledgers.</p>
                            <button
                                onClick={handleExportBackup}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer shadow"
                            >
                                Export Backup File (.db)
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                            <div className="font-semibold text-sm text-white flex items-center gap-2">
                                <Upload className="w-4 h-4 text-amber-400" /> Restore Database Backup
                            </div>
                            <p className="text-xs text-slate-400">Restores database from a selected snapshot. Application restart recommended after restore.</p>
                            <button
                                onClick={handleImportRestore}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
                            >
                                Restore from File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
