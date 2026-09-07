import React from "react";
import { LayoutDashboard, ShoppingBag, Boxes, ShoppingCart, Receipt, Users, DollarSign, BarChart3, Settings as SettingsIcon, Database, Store } from "lucide-react";

export type NavTab = "dashboard" | "products" | "stock" | "purchases" | "pos" | "customers-suppliers" | "expenses" | "reports" | "settings";

interface NavigationProps {
    activeTab: NavTab;
    setActiveTab: (tab: NavTab) => void;
    shopName: string;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, shopName }) => {
    const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: "pos", label: "POS Terminal", icon: <Receipt className="w-5 h-5" />, badge: "FAST" },
        { id: "products", label: "Products & Sizes", icon: <ShoppingBag className="w-5 h-5" /> },
        { id: "stock", label: "Stock Inventory", icon: <Boxes className="w-5 h-5" /> },
        { id: "purchases", label: "Purchases", icon: <ShoppingCart className="w-5 h-5" /> },
        { id: "customers-suppliers", label: "Customers Directory", icon: <Users className="w-5 h-5" /> },
        { id: "expenses", label: "Expenses", icon: <DollarSign className="w-5 h-5" /> },
        { id: "reports", label: "Reports & Profit", icon: <BarChart3 className="w-5 h-5" /> },
        { id: "settings", label: "Settings & Backup", icon: <SettingsIcon className="w-5 h-5" /> },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-xs">
            {/* Header / Brand */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                    <Store className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                    <h1 className="font-bold text-slate-900 text-base truncate">{shopName}</h1>
                </div>
            </div>

            {/* Nav List */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer ${
                                isActive ? "bg-slate-900 text-white font-semibold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>{item.badge}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* DB Status Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        SQLite Database
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">v1.0.0</span>
                </div>
            </div>
        </aside>
    );
};
