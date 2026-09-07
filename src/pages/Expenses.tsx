import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface ExpensesProps {
    currencySymbol: string;
}

export const Expenses: React.FC<ExpensesProps> = ({ currencySymbol }) => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<"RENT" | "SALARY" | "ELECTRICITY" | "INTERNET" | "TRANSPORT" | "MARKETING" | "MAINTENANCE" | "OTHER">("OTHER");
    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER" | "OTHER">("CASH");

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const res = await window.electronAPI.getExpenses();
            setExpenses(res || []);
        } catch (err) {
            console.error("Failed to load expenses:", err);
        }
    };

    const handleCreateExpense = async () => {
        if (!title.trim() || amount <= 0) {
            alert("Title and valid Amount are required!");
            return;
        }

        try {
            await window.electronAPI.createExpense({
                title,
                description,
                category,
                amount,
                paymentMethod,
                userId: 1,
            });

            setShowModal(false);
            setTitle("");
            setDescription("");
            setAmount(0);
            loadExpenses();
        } catch (err: any) {
            alert(`Failed to add expense: ${err.message || err}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Delete this expense record?")) {
            await window.electronAPI.deleteExpense(id);
            loadExpenses();
        }
    };

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-950">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Shop Operating Expenses</h1>
                    <p className="text-sm text-slate-400">Record shop rent, salaries, utilities, transport, and maintenance costs</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4" /> Add Expense Entry
                </button>
            </div>

            {/* Total Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl max-w-sm">
                <div className="text-xs text-slate-400 font-semibold uppercase">Total Recorded Expenses</div>
                <div className="text-2xl font-bold text-rose-400">{currencySymbol} {totalExpense.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Subtracted directly from Gross Profit</div>
            </div>

            {/* Expenses Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Title & Notes</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Payment Method</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {expenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-800/40">
                                <td className="px-4 py-3 text-xs text-slate-400">{new Date(e.expenseDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-white">{e.title}</div>
                                    {e.description && <div className="text-xs text-slate-400">{e.description}</div>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-[10px] font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                                        {e.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">{e.paymentMethod}</td>
                                <td className="px-4 py-3 font-bold text-rose-400">{currencySymbol} {Number(e.amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleDelete(e.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
                        <h3 className="font-bold text-white text-lg">Record Shop Expense</h3>

                        <div>
                            <label className="text-xs text-slate-400">Expense Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Monthly Shop Rent"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400">Category</label>
                                <select
                                    value={category}
                                    onChange={(e: any) => setCategory(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1"
                                >
                                    <option value="RENT">Rent</option>
                                    <option value="SALARY">Salary</option>
                                    <option value="ELECTRICITY">Electricity</option>
                                    <option value="INTERNET">Internet</option>
                                    <option value="TRANSPORT">Transport</option>
                                    <option value="MARKETING">Marketing</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Amount ({currencySymbol}) *</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1 font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e: any) => setPaymentMethod(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="MOBILE_BANKING">Mobile Banking</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Description / Notes</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white p-2 rounded text-sm mt-1"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={handleCreateExpense} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold cursor-pointer">
                                Save Expense
                            </button>
                            <button onClick={() => setShowModal(false)} className="px-4 bg-slate-800 text-slate-300 py-2 rounded-lg cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
