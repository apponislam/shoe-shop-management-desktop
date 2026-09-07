import React, { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Boxes, AlertTriangle, TrendingUp, Users, Receipt, PlusCircle } from "lucide-react";
import type { NavTab } from "../components/Navigation";

interface DashboardProps {
    setActiveTab: (tab: NavTab) => void;
    currencySymbol: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, currencySymbol }) => {
    const [stats, setStats] = useState<any>(null);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const resStats = await window.electronAPI.getDashboardStats();
            const resLowStock = await window.electronAPI.getLowStockVariants();
            setStats(resStats);
            setLowStock(resLowStock || []);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-600">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                    Loading Dashboard Analytics...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-900">
            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Overview & Performance</h1>
                    <p className="text-sm text-slate-500">Real-time stats from local SQLite database</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTab("pos")} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow cursor-pointer">
                        <Receipt className="w-4 h-4 text-white" />
                        Open POS Terminal
                    </button>
                    <button onClick={() => setActiveTab("products")} className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-lg font-bold text-sm border border-slate-300 shadow-xs cursor-pointer">
                        <PlusCircle className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-2 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">
                        {currencySymbol} {stats?.todaySalesTotal?.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                        <span>{stats?.todaySalesCount || 0} transactions completed</span>
                    </div>
                </div>

                {/* Today's Purchases */}
                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-2 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Today's Purchases</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">
                        {currencySymbol} {stats?.todayPurchasesTotal?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Restock expenditure</div>
                </div>

                {/* Total Inventory Stock */}
                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-2 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Stock Pairs</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">{stats?.totalStock || 0} pairs</div>
                    <div className="text-xs text-slate-500 font-medium">Across {stats?.totalProducts || 0} active models</div>
                </div>

                {/* Customer & Supplier Dues */}
                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-2 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider">Pending Dues</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div>
                            <span className="text-xs text-slate-500">Customer: </span>
                            <span className="text-base font-bold text-amber-700">
                                {currencySymbol} {stats?.totalCustomerDue?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Outstanding customer ledgers</div>
                </div>
            </div>

            {/* Low Stock Alert & Recent Sales Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Low Stock Warning Box */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span>Low Stock Alerts ({lowStock.length})</span>
                        </div>
                        <button onClick={() => setActiveTab("stock")} className="text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer underline">
                            View All
                        </button>
                    </div>

                    {lowStock.length === 0 ? (
                        <div className="text-slate-500 text-sm py-6 text-center font-medium">All product sizes are well stocked!</div>
                    ) : (
                        <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1">
                            {lowStock.slice(0, 6).map((item) => (
                                <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-sm text-slate-900">{item.product?.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                            <span>SKU: {item.sku}</span>
                                            {item.size && <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700">Size {item.size.name}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-rose-700">{item.stock} in stock</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Min: {item.minimumStock}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transactions Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="font-bold text-slate-900 text-base">Recent Sales Transactions</h2>
                        <button onClick={() => setActiveTab("reports")} className="text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer underline">
                            Full Report
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                                <tr>
                                    <th className="px-3.5 py-2.5 rounded-l">Invoice</th>
                                    <th className="px-3.5 py-2.5">Customer</th>
                                    <th className="px-3.5 py-2.5">Method</th>
                                    <th className="px-3.5 py-2.5">Total</th>
                                    <th className="px-3.5 py-2.5 text-right rounded-r">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.recentSales?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                                            No sales recorded today yet
                                        </td>
                                    </tr>
                                ) : (
                                    stats?.recentSales?.map((sale: any) => (
                                        <tr key={sale.id} className="hover:bg-slate-50">
                                            <td className="px-3.5 py-3 font-mono text-slate-900 font-bold text-xs">{sale.invoiceNumber}</td>
                                            <td className="px-3.5 py-3 text-slate-700 font-medium">{sale.customer ? sale.customer.name : "Walk-in Customer"}</td>
                                            <td className="px-3.5 py-3 text-xs text-slate-600 font-medium">{sale.paymentMethod}</td>
                                            <td className="px-3.5 py-3 font-extrabold text-slate-900">
                                                {currencySymbol} {Number(sale.total).toLocaleString()}
                                            </td>
                                            <td className="px-3.5 py-3 text-right">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sale.dueAmount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{sale.dueAmount > 0 ? `DUE (${currencySymbol}${sale.dueAmount})` : "PAID"}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
