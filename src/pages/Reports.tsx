import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ReportsProps {
    currencySymbol: string;
}

export const Reports: React.FC<ReportsProps> = ({ currencySymbol }) => {
    const [pnl, setPnl] = useState<any>(null);
    const [salesList, setSalesList] = useState<any[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        try {
            const params = startDate || endDate ? { startDate, endDate } : undefined;
            const resPnl = await window.electronAPI.getProfitAndLossReport(params);
            const resSales = await window.electronAPI.getSales(params);
            setPnl(resPnl || null);
            setSalesList(resSales || []);
        } catch (err) {
            console.error("Failed to load reports:", err);
        }
    };

    const chartData = [
        { name: "Revenue", amount: pnl?.totalRevenue || 0 },
        { name: "Cost of Goods (COGS)", amount: pnl?.totalCOGS || 0 },
        { name: "Gross Profit", amount: pnl?.grossProfit || 0 },
        { name: "Expenses", amount: pnl?.totalExpenses || 0 },
        { name: "Net Profit", amount: pnl?.netProfit || 0 },
    ];

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Executive Profit & Loss Analysis</h1>
                    <p className="text-sm text-slate-400">Calculates Net Profit = Revenue - COGS - Expenses</p>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white p-1 rounded"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white p-1 rounded"
                    />
                    <button onClick={loadReportData} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-bold cursor-pointer">
                        Filter
                    </button>
                </div>
            </div>

            {/* P&L Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sales Revenue</div>
                    <div className="text-xl font-bold text-white">{currencySymbol} {pnl?.totalRevenue?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cost of Goods (COGS)</div>
                    <div className="text-xl font-bold text-amber-400">{currencySymbol} {pnl?.totalCOGS?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Profit</div>
                    <div className="text-xl font-bold text-indigo-400">{currencySymbol} {pnl?.grossProfit?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Operating Expenses</div>
                    <div className="text-xl font-bold text-rose-400">{currencySymbol} {pnl?.totalExpenses?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Net Profit</div>
                    <div className={`text-xl font-bold ${pnl?.netProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {currencySymbol} {pnl?.netProfit?.toLocaleString() || 0}
                    </div>
                </div>
            </div>

            {/* Recharts Bar Graph */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="font-bold text-white text-base">Financial Overview Chart</h2>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                            <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Sales History Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="font-bold text-white text-base">Sales Transaction History Log</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950">
                            <tr>
                                <th className="px-4 py-3">Invoice</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Items Sold</th>
                                <th className="px-4 py-3">Total Amount</th>
                                <th className="px-4 py-3">Paid</th>
                                <th className="px-4 py-3 text-right">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {salesList.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-800/40">
                                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{s.invoiceNumber}</td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.soldAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-white">{s.customer?.name || "Walk-in Customer"}</td>
                                    <td className="px-4 py-3 text-xs">{s.items?.length || 0} items</td>
                                    <td className="px-4 py-3 font-bold text-white">{currencySymbol} {Number(s.total).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-emerald-400">{currencySymbol} {Number(s.paidAmount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-amber-400">
                                        {Number(s.dueAmount) > 0 ? `${currencySymbol}${Number(s.dueAmount).toLocaleString()}` : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
