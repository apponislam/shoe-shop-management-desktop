import React, { useEffect, useState } from "react";
import { SlidersHorizontal, RefreshCw } from "lucide-react";

interface StockProps {
    currencySymbol: string;
}

export const Stock: React.FC<StockProps> = ({ currencySymbol }) => {
    const [movements, setMovements] = useState<any[]>([]);
    const [valuation, setValuation] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);

    // Adjustment Modal
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<number>(0);
    const [adjustType, setAdjustType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "DAMAGE">("ADJUSTMENT_IN");
    const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
    const [adjustNotes, setAdjustNotes] = useState("");

    useEffect(() => {
        loadStockData();
    }, []);

    const loadStockData = async () => {
        try {
            const [m, val, prods] = await Promise.all([
                window.electronAPI.getStockMovements({ limit: 100 }),
                window.electronAPI.getStockValuation(),
                window.electronAPI.getProducts(),
            ]);

            setMovements(m || []);
            setValuation(val || null);
            setProducts(prods || []);

            if (prods && prods.length > 0 && prods[0].variants?.length > 0) {
                setSelectedVariantId(prods[0].variants[0].id);
            }
        } catch (err) {
            console.error("Failed to load stock data:", err);
        }
    };

    const handleAdjustStock = async () => {
        if (!selectedVariantId || adjustQuantity <= 0) return;

        try {
            await window.electronAPI.adjustStock({
                variantId: selectedVariantId,
                userId: 1,
                type: adjustType,
                quantity: adjustQuantity,
                notes: adjustNotes,
            });

            setShowAdjustModal(false);
            setAdjustQuantity(1);
            setAdjustNotes("");
            loadStockData();
        } catch (err: any) {
            alert(`Stock adjustment failed: ${err.message || err}`);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Inventory & Movements</h1>
                    <p className="text-sm text-slate-500">Track real-time stock additions, sales deductions, and adjustments</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAdjustModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-white" /> Manual Stock Adjustment
                    </button>
                </div>
            </div>

            {/* Valuation Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-xs">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total In-Stock Pairs</div>
                    <div className="text-2xl font-extrabold text-slate-900">{valuation?.totalQuantity || 0} pairs</div>
                    <div className="text-xs text-slate-500 font-medium">Across {valuation?.totalVariants || 0} variants</div>
                </div>

                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-xs">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Purchase Stock Valuation</div>
                    <div className="text-2xl font-extrabold text-slate-900">{currencySymbol} {valuation?.totalPurchaseValuation?.toLocaleString() || 0}</div>
                    <div className="text-xs text-slate-500 font-medium">At cost price</div>
                </div>

                <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-xs">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expected Selling Value</div>
                    <div className="text-2xl font-extrabold text-slate-900">{currencySymbol} {valuation?.totalSellingValuation?.toLocaleString() || 0}</div>
                    <div className="text-xs text-emerald-700 font-bold">Potential profit: {currencySymbol} {valuation?.potentialProfit?.toLocaleString() || 0}</div>
                </div>
            </div>

            {/* Stock Movement Log Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 text-base">Stock Movement History Audit Log</h2>
                    <button onClick={loadStockData} className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                            <tr>
                                <th className="px-4 py-3">Date/Time</th>
                                <th className="px-4 py-3">Shoe Product</th>
                                <th className="px-4 py-3">Movement Type</th>
                                <th className="px-4 py-3">Prev Stock</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">New Stock</th>
                                <th className="px-4 py-3">Reference / Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movements.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">{new Date(m.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-900">{m.variant?.product?.name}</div>
                                        <div className="text-xs text-slate-500 font-medium">
                                            {m.variant?.size && <span>Size {m.variant.size.name} • </span>}
                                            <span className="font-mono">{m.variant?.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            m.type === "SALE" ? "bg-rose-100 text-rose-800" : m.type === "PURCHASE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800 border border-slate-200"
                                        }`}>
                                            {m.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 font-medium">{m.previousStock}</td>
                                    <td className={`px-4 py-3 font-bold ${m.type === "SALE" || m.type === "DAMAGE" || m.type === "ADJUSTMENT_OUT" ? "text-rose-700" : "text-emerald-700"}`}>
                                        {m.type === "SALE" || m.type === "DAMAGE" || m.type === "ADJUSTMENT_OUT" ? `-${m.quantity}` : `+${m.quantity}`}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-900">{m.newStock}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">{m.reference || m.notes || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-900">
                        <h3 className="font-bold text-slate-900 text-lg">Stock Adjustment & Damage Log</h3>

                        <div>
                            <label className="text-xs text-slate-500 font-medium">Select Shoe Variant *</label>
                            <select
                                value={selectedVariantId}
                                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                            >
                                {products.flatMap((p) =>
                                    p.variants?.map((v: any) => (
                                        <option key={v.id} value={v.id}>
                                            {p.name} {v.size ? `(Size ${v.size.name})` : ""} - Stock: {v.stock}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Type</label>
                                <select
                                    value={adjustType}
                                    onChange={(e: any) => setAdjustType(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                                >
                                    <option value="ADJUSTMENT_IN">Stock In (+)</option>
                                    <option value="ADJUSTMENT_OUT">Stock Out (-)</option>
                                    <option value="DAMAGE">Damaged / Lost (-)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-medium">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustQuantity}
                                    onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 font-medium">Notes / Reason</label>
                            <input
                                type="text"
                                placeholder="e.g. Stock audit discrepancy"
                                value={adjustNotes}
                                onChange={(e) => setAdjustNotes(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={handleAdjustStock} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-bold text-sm cursor-pointer shadow">
                                Confirm Adjustment
                            </button>
                            <button onClick={() => setShowAdjustModal(false)} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold text-xs cursor-pointer border border-slate-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
