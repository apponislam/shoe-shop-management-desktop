import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

interface PurchasesProps {
    currencySymbol: string;
}

export const Purchases: React.FC<PurchasesProps> = ({ currencySymbol }) => {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
    const [purchaseItems, setPurchaseItems] = useState<
        Array<{
            productId: number;
            variantId: number;
            quantity: number;
            unitPrice: number;
        }>
    >([]);
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [p, supps, prods] = await Promise.all([
                window.electronAPI.getPurchases(),
                window.electronAPI.getSuppliers(),
                window.electronAPI.getProducts(),
            ]);

            setPurchases(p || []);
            setSuppliers(supps || []);
            setProducts(prods || []);

            if (supps && supps.length > 0) setSelectedSupplierId(supps[0].id);
        } catch (err) {
            console.error("Failed to load purchases:", err);
        }
    };

    const addItemRow = () => {
        if (products.length === 0) return;
        const firstProd = products[0];
        const firstVar = firstProd.variants?.[0];
        if (!firstVar) return;

        setPurchaseItems([
            ...purchaseItems,
            {
                productId: firstProd.id,
                variantId: firstVar.id,
                quantity: 10,
                unitPrice: Number(firstVar.purchasePrice) || 1000,
            },
        ]);
    };

    const subtotal = purchaseItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = Math.max(0, subtotal - discount);
    const dueAmount = Math.max(0, total - paidAmount);

    const handleCreatePurchase = async () => {
        if (!selectedSupplierId || purchaseItems.length === 0) {
            alert("Supplier and at least 1 item are required!");
            return;
        }

        try {
            await window.electronAPI.createPurchase({
                supplierId: selectedSupplierId,
                userId: 1,
                subtotal,
                discount,
                total,
                paidAmount,
                dueAmount,
                items: purchaseItems.map((i) => ({
                    ...i,
                    total: i.unitPrice * i.quantity,
                })),
            });

            setShowNewPurchaseModal(false);
            setPurchaseItems([]);
            setDiscount(0);
            setPaidAmount(0);
            loadData();
        } catch (err: any) {
            alert(`Failed to save purchase: ${err.message || err}`);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Supplier Purchases & Inbound Stock</h1>
                    <p className="text-sm text-slate-400">Manage supplier orders, cost calculations, and inventory restock</p>
                </div>

                <button
                    onClick={() => {
                        setShowNewPurchaseModal(true);
                        addItemRow();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4" /> Create New Purchase Order
                </button>
            </div>

            {/* Purchases List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950">
                        <tr>
                            <th className="px-4 py-3">Invoice #</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3">Purchased Date</th>
                            <th className="px-4 py-3">Items Count</th>
                            <th className="px-4 py-3">Total Amount</th>
                            <th className="px-4 py-3">Paid</th>
                            <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {purchases.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/40">
                                <td className="px-4 py-3 font-mono font-bold text-indigo-400">{p.invoiceNumber}</td>
                                <td className="px-4 py-3 font-semibold text-white">{p.supplier?.name}</td>
                                <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-xs">{p.items?.length || 0} items</td>
                                <td className="px-4 py-3 font-bold text-white">{currencySymbol} {Number(p.total).toLocaleString()}</td>
                                <td className="px-4 py-3 text-emerald-400 font-semibold">{currencySymbol} {Number(p.paidAmount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        p.dueAmount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                                    }`}>
                                        {p.dueAmount > 0 ? `DUE (${currencySymbol}${p.dueAmount})` : "RECEIVED"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Purchase Order Modal */}
            {showNewPurchaseModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 my-8">
                        <h3 className="font-bold text-white text-lg">New Supplier Purchase Order</h3>

                        <div>
                            <label className="text-xs text-slate-400">Select Supplier *</label>
                            <select
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1"
                            >
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.phone || "No Phone"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold text-slate-300 uppercase">Purchase Items & Quantity</h4>
                                <button onClick={addItemRow} className="text-xs text-indigo-400 font-bold hover:underline cursor-pointer">
                                    + Add Item
                                </button>
                            </div>

                            {purchaseItems.map((item, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg grid grid-cols-4 gap-3 text-xs">
                                    <div className="col-span-2">
                                        <label className="text-slate-400">Shoe & Variant</label>
                                        <select
                                            value={item.variantId}
                                            onChange={(e) => {
                                                const vId = Number(e.target.value);
                                                const copy = [...purchaseItems];
                                                copy[idx].variantId = vId;
                                                setPurchaseItems(copy);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-white p-1.5 rounded mt-1"
                                        >
                                            {products.flatMap((p) =>
                                                p.variants?.map((v: any) => (
                                                    <option key={v.id} value={v.id}>
                                                        {p.name} {v.size ? `(Size ${v.size.name})` : ""}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-slate-400">Qty Pairs</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const copy = [...purchaseItems];
                                                copy[idx].quantity = parseInt(e.target.value) || 1;
                                                setPurchaseItems(copy);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-white p-1.5 rounded mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-400">Unit Cost ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                                const copy = [...purchaseItems];
                                                copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                setPurchaseItems(copy);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-800 text-white p-1.5 rounded mt-1"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary & Payment */}
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-bold">{currencySymbol} {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Supplier Discount:</span>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-900 border border-slate-800 text-white p-1 rounded text-right"
                                />
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                                <span>Total Order Amount:</span>
                                <span>{currencySymbol} {total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Paid Amount:</span>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-900 border border-slate-800 text-white p-1 rounded text-right font-bold"
                                />
                            </div>
                            <div className="flex justify-between text-amber-400 font-bold">
                                <span>Remaining Due:</span>
                                <span>{currencySymbol} {dueAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={handleCreatePurchase} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold cursor-pointer">
                                Confirm & Update Stock
                            </button>
                            <button onClick={() => setShowNewPurchaseModal(false)} className="px-4 bg-slate-800 text-slate-300 py-2 rounded-lg cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
