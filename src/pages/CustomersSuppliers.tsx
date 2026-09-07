import React, { useEffect, useState } from "react";
import { Plus, Search, Phone, MapPin } from "lucide-react";

interface CustomersSuppliersProps {
    currencySymbol: string;
}

export const CustomersSuppliers: React.FC<CustomersSuppliersProps> = ({ currencySymbol }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [openingDue, setOpeningDue] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const custs = await window.electronAPI.getCustomers(searchQuery);
            setCustomers(custs || []);
        } catch (err) {
            console.error("Failed to load customer ledgers:", err);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        const res = await window.electronAPI.getCustomers(query);
        setCustomers(res || []);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setOpeningDue(0);
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setName(item.name || "");
        setPhone(item.phone || "");
        setEmail(item.email || "");
        setAddress(item.address || "");
        setOpeningDue(Number(item.openingDue || 0));
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            if (editingItem) {
                await window.electronAPI.updateCustomer(editingItem.id, { name, phone, email, address, openingDue });
            } else {
                await window.electronAPI.createCustomer({ name, phone, email, address, openingDue });
            }

            setShowModal(false);
            setEditingItem(null);
            setName("");
            setPhone("");
            setEmail("");
            setAddress("");
            setOpeningDue(0);
            loadData();
        } catch (err: any) {
            alert(`Error saving customer: ${err.message || err}`);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
            try {
                await window.electronAPI.deleteCustomer(id);
                loadData();
            } catch (err: any) {
                alert(`Failed to delete customer: ${err.message || err}`);
            }
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers Directory</h1>
                    <p className="text-sm text-slate-500">Manage customer phone numbers, names, addresses, and credit ledgers</p>
                </div>

                <button
                    onClick={openAddModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer shadow capitalize"
                >
                    <Plus className="w-4 h-4" /> Add New Customer
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search customers by name or phone..."
                    className="w-full bg-white border border-slate-200 text-slate-900 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
            </div>

            {/* Grid directory */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map((item) => {
                    const totalHistory = item.sales || [];
                    const totalDue = totalHistory.reduce((sum: number, x: any) => sum + Number(x.dueAmount || 0), 0) + Number(item.openingDue || 0);

                    return (
                        <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <Phone className="w-3 h-3 text-slate-600" />
                                        <span>{item.phone || "No Phone Registered"}</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${totalDue > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                    {totalDue > 0 ? `DUE: ${currencySymbol}${totalDue.toLocaleString()}` : "CLEARED"}
                                </span>
                            </div>

                            {item.address && (
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="line-clamp-1">{item.address}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                <div>
                                    <span>Sales: <strong className="text-slate-900">{totalHistory.length}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="text-xs text-slate-700 hover:text-slate-900 font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                        <h3 className="font-bold text-slate-900 text-lg">{editingItem ? "Edit" : "Add New"} Customer</h3>

                        <div>
                            <label className="text-xs text-slate-500">Full Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded text-sm mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500">Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded text-sm mt-1 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Opening Due ({currencySymbol})</label>
                                <input
                                    type="number"
                                    value={openingDue}
                                    onChange={(e) => setOpeningDue(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded text-sm mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded text-sm mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500">Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded text-sm mt-1"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-pointer shadow"
                            >
                                Save Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
