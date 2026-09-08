import React, { useEffect, useState, useRef } from "react";
import { Search, Barcode, Trash2, Plus, Minus, Printer, CheckCircle2, UserPlus, ShoppingCart } from "lucide-react";
import { useToast } from "../components/Toast";

interface POSProps {
    currencySymbol: string;
}

interface CartItem {
    variantId: number;
    productId: number;
    name: string;
    sizeName?: string;
    colorName?: string;
    sku: string;
    barcode?: string;
    unitPrice: number;
    quantity: number;
    discount: number;
    maxStock: number;
}

export const POS: React.FC<POSProps> = ({ currencySymbol }) => {
    const { toast } = useToast();
    const [barcodeInput, setBarcodeInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customers
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);

    // Discounts & Payments
    const [overallDiscount, setOverallDiscount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE_BANKING" | "BANK_TRANSFER" | "OTHER">("CASH");
    const [paidAmountInput, setPaidAmountInput] = useState<string>("");
    const [notes, setNotes] = useState("");

    // Receipt Modal / Completion
    const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Quick Add Customer Modal State
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustName, setNewCustName] = useState("");
    const [newCustPhone, setNewCustPhone] = useState("");
    const [newCustAddress, setNewCustAddress] = useState("");

    const handleCreateCustomerQuick = async () => {
        if (!newCustName.trim()) {
            toast.error("Customer Name is required");
            return;
        }
        try {
            const created = await window.electronAPI.createCustomer({
                name: newCustName,
                phone: newCustPhone,
                address: newCustAddress,
            });
            setShowAddCustomerModal(false);
            setNewCustName("");
            setNewCustPhone("");
            setNewCustAddress("");

            const custs = await window.electronAPI.getCustomers();
            setCustomers(custs || []);
            if (created) setSelectedCustomerId(created.id);
            toast.success(`Customer "${newCustName}" added!`);
        } catch (err: any) {
            toast.error(`Failed to add customer: ${err.message || err}`);
        }
    };

    const barcodeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadInitialData();
        barcodeRef.current?.focus();
    }, []);

    const loadInitialData = async () => {
        try {
            const custs = await window.electronAPI.getCustomers();
            setCustomers(custs || []);
            const defaultProds = await window.electronAPI.getProducts();
            setSearchResults(defaultProds || []);
        } catch (err) {
            console.error("Failed to load POS data:", err);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        try {
            const prods = await window.electronAPI.getProducts({ search: query });
            setSearchResults(prods || []);
        } catch (err) {
            console.error("Search failed:", err);
        }
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        try {
            const variant = await window.electronAPI.findVariantByBarcodeOrSku(barcodeInput.trim());
            if (variant) {
                addVariantToCart(variant);
                setBarcodeInput("");
            } else {
                toast.error(`No variant found with Barcode/SKU: ${barcodeInput}`);
            }
        } catch (err) {
            console.error("Barcode lookup failed:", err);
        }
    };

    const addVariantToCart = (variant: any) => {
        if (variant.stock <= 0) {
            toast.error(`Stock unavailable for ${variant.product.name} (SKU: ${variant.sku})`);
            return;
        }

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) => item.variantId === variant.id);
            if (existingIndex > -1) {
                const updated = [...prevCart];
                const currentQty = updated[existingIndex].quantity;
                if (currentQty + 1 > variant.stock) {
                    alert(`Cannot add more than ${variant.stock} pairs in stock.`);
                    return prevCart;
                }
                updated[existingIndex].quantity += 1;
                return updated;
            } else {
                return [
                    ...prevCart,
                    {
                        variantId: variant.id,
                        productId: variant.product.id,
                        name: variant.product.name,
                        sizeName: variant.size?.name,
                        colorName: variant.color?.name,
                        sku: variant.sku,
                        barcode: variant.barcode,
                        unitPrice: Number(variant.sellingPrice),
                        quantity: 1,
                        discount: 0,
                        maxStock: variant.stock,
                    },
                ];
            }
        });
    };

    const updateQuantity = (variantId: number, delta: number) => {
        setCart((prevCart) => {
            return prevCart
                .map((item) => {
                    if (item.variantId === variantId) {
                        const newQty = item.quantity + delta;
                        if (newQty > item.maxStock) {
                            alert(`Stock limit reached (${item.maxStock} pairs available).`);
                            return item;
                        }
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeItem = (variantId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
    };

    // Computations
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
    const totalAmount = Math.max(0, subtotal - overallDiscount);
    const numericPaid = paidAmountInput === "" ? totalAmount : parseFloat(paidAmountInput) || 0;
    const dueAmount = Math.max(0, totalAmount - numericPaid);
    const changeAmount = Math.max(0, numericPaid - totalAmount);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            setIsSubmitting(true);

            const saleInput = {
                customerId: selectedCustomerId,
                userId: 1,
                subtotal,
                discount: overallDiscount,
                total: totalAmount,
                paidAmount: numericPaid,
                dueAmount,
                changeAmount,
                paymentMethod,
                notes,
                items: cart.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    total: item.unitPrice * item.quantity - item.discount,
                })),
            };

            const createdSale = await window.electronAPI.createSale(saleInput);
            const fullSale = await window.electronAPI.getSaleById(createdSale.id);

            setLastCompletedSale(fullSale);
            setShowReceiptModal(true);

            // Reset cart
            setCart([]);
            setOverallDiscount(0);
            setPaidAmountInput("");
            setNotes("");
        } catch (err: any) {
            alert(`Checkout failed: ${err.message || err}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 text-slate-900 h-screen overflow-hidden">
            {/* Left Column: Barcode & Product Catalog */}
            <div className="flex-1 flex flex-col p-4 space-y-4 border-r border-slate-200 overflow-y-auto bg-slate-50">
                {/* Top Search / Barcode Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <form onSubmit={handleBarcodeSubmit} className="relative">
                        <Barcode className="w-5 h-5 text-slate-600 absolute left-3 top-3" />
                        <input
                            ref={barcodeRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            placeholder="Scan Barcode / SKU (Press Enter)..."
                            className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono shadow-xs"
                        />
                    </form>

                    <div className="relative">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by shoe name..."
                            className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-xs"
                        />
                    </div>
                </div>

                {/* Product Catalog Grid */}
                <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {searchResults.map((product) => (
                            <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-400 transition-all shadow-xs">
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{product.category?.name}</div>
                                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{product.name}</h3>
                                    {product.brand && <div className="text-xs text-slate-500 mt-0.5">{product.brand.name}</div>}
                                </div>

                                {/* Sizes / Variants Buttons */}
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Select Size Variant:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {product.variants?.map((v: any) => (
                                            <button
                                                key={v.id}
                                                disabled={v.stock <= 0}
                                                onClick={() => addVariantToCart({ ...v, product })}
                                                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer border ${
                                                    v.stock <= 0
                                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                        : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs"
                                                }`}
                                            >
                                                {v.size ? `Sz ${v.size.name}` : "STD"} ({currencySymbol}{Number(v.sellingPrice)})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: POS Cart & Checkout Panel */}
            <div className="w-full lg:w-96 bg-white flex flex-col h-full border-l border-slate-200 shrink-0 shadow-sm">
                {/* Cart Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                        <ShoppingCart className="w-5 h-5 text-slate-700" />
                        <span>Current POS Cart</span>
                    </div>
                    <span className="text-xs bg-slate-900 text-white font-bold px-2.5 py-1 rounded-full">{cart.reduce((sum, i) => sum + i.quantity, 0)} Items</span>
                </div>

                {/* Customer Selector */}
                <div className="p-3 border-b border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                        <span className="flex items-center gap-1.5 font-bold">
                            <UserPlus className="w-4 h-4 text-slate-600" /> Customer:
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowAddCustomerModal(true)}
                            className="text-xs text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all"
                        >
                            + New Customer
                        </button>
                    </div>
                    <select value={selectedCustomerId || ""} onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-slate-50 text-slate-900 text-xs border border-slate-300 rounded-md px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400">
                        <option value="">Walk-in Customer (General)</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.phone || "No Phone"})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
                    {cart.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm font-medium">Scan a barcode or click a shoe variant to build cart</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.variantId} className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-xs">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                                            {item.sizeName && <span>Size {item.sizeName}</span>}
                                            {item.colorName && <span>• {item.colorName}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => removeItem(item.variantId)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md p-0.5">
                                        <button onClick={() => updateQuantity(item.variantId, -1)} className="p-1 hover:text-slate-900 cursor-pointer">
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-bold text-slate-900 px-2">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.variantId, 1)} className="p-1 hover:text-slate-900 cursor-pointer">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="font-bold text-slate-900 text-sm">
                                        {currencySymbol} {(item.unitPrice * item.quantity - item.discount).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout & Summary Footer */}
                <div className="p-4 border-t border-slate-200 bg-white space-y-3 shadow-xs">
                    {/* Subtotal & Discount inputs */}
                    <div className="space-y-2 text-xs text-slate-700 font-medium">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-bold text-slate-900">
                                {currencySymbol} {subtotal.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Overall Discount:</span>
                            <div className="flex items-center gap-1">
                                <span>{currencySymbol}</span>
                                <input type="number" min="0" value={overallDiscount || ""} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 border border-slate-300 text-slate-900 px-2 py-1 rounded-md text-xs text-right font-bold focus:outline-none" />
                            </div>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Payable:</span>
                            <span>
                                {currencySymbol} {totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Payment Inputs */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Method</label>
                            <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md p-2 mt-1 font-semibold focus:outline-none">
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="MOBILE_BANKING">Mobile Banking</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Paid Amount</label>
                            <input type="number" placeholder={totalAmount.toString()} value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md p-2 mt-1 font-bold focus:outline-none" />
                        </div>
                    </div>

                    {/* Change / Due Output */}
                    <div className="flex justify-between text-xs font-semibold bg-slate-50 p-2.5 rounded-md border border-slate-200">
                        <span className={dueAmount > 0 ? "text-amber-700 font-bold" : "text-slate-500"}>
                            Due: {currencySymbol} {dueAmount.toLocaleString()}
                        </span>
                        <span className={changeAmount > 0 ? "text-emerald-700 font-bold" : "text-slate-500"}>
                            Change: {currencySymbol} {changeAmount.toLocaleString()}
                        </span>
                    </div>

                    {/* Complete Sale Button */}
                    <button
                        disabled={isSubmitting || cart.length === 0}
                        onClick={handleCheckout}
                        className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>{isSubmitting ? "Processing..." : "Complete Sale & Print"}</span>
                    </button>
                </div>
            </div>

            {/* Receipt Print Modal */}
            {showReceiptModal && lastCompletedSale && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-slate-900">
                        <div className="text-center pb-2 border-b border-slate-200">
                            <CheckCircle2 className="w-10 h-10 text-slate-900 mx-auto mb-1" />
                            <h3 className="font-bold text-lg text-slate-900">Transaction Complete</h3>
                            <p className="text-xs text-slate-500 font-mono">Invoice #{lastCompletedSale.invoiceNumber}</p>
                        </div>

                        {/* Thermal Printable Receipt Content */}
                        <div id="printable-receipt" className="text-xs space-y-2 font-mono border border-slate-200 p-4 rounded-lg bg-slate-50">
                            <div className="text-center font-bold text-sm">SHOE SHOP MANAGEMENT</div>
                            <div className="text-center text-[10px] text-slate-600">POS Sales Receipt</div>
                            <div className="border-b border-dashed border-slate-300 my-2"></div>

                            <div className="flex justify-between text-[11px]">
                                <span>Invoice:</span>
                                <span className="font-bold">{lastCompletedSale.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span>Date:</span>
                                <span>{new Date(lastCompletedSale.soldAt).toLocaleString()}</span>
                            </div>
                            {lastCompletedSale.customer && (
                                <div className="flex justify-between text-[11px]">
                                    <span>Customer:</span>
                                    <span>{lastCompletedSale.customer.name}</span>
                                </div>
                            )}

                            <div className="border-b border-dashed border-slate-300 my-2"></div>

                            {/* Item list */}
                            <div className="space-y-1">
                                {lastCompletedSale.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-[11px]">
                                        <div className="line-clamp-1 flex-1 pr-2">
                                            {item.product?.name} ({item.variant?.size ? `Sz ${item.variant.size.name}` : "STD"}) x{item.quantity}
                                        </div>
                                        <div className="font-bold">
                                            {currencySymbol} {Number(item.total).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-b border-dashed border-slate-300 my-2"></div>

                            <div className="flex justify-between font-bold text-sm">
                                <span>TOTAL:</span>
                                <span>
                                    {currencySymbol} {Number(lastCompletedSale.total).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Paid ({lastCompletedSale.paymentMethod}):</span>
                                <span>
                                    {currencySymbol} {Number(lastCompletedSale.paidAmount).toLocaleString()}
                                </span>
                            </div>
                            {Number(lastCompletedSale.dueAmount) > 0 && (
                                <div className="flex justify-between font-bold text-rose-700">
                                    <span>Due Amount:</span>
                                    <span>
                                        {currencySymbol} {Number(lastCompletedSale.dueAmount).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="text-center pt-3 text-[10px] italic text-slate-600">Thank you for shopping with us!</div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => window.print()} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer shadow">
                                <Printer className="w-4 h-4 text-white" /> Print Thermal Receipt
                            </button>
                            <button onClick={() => setShowReceiptModal(false)} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-lg font-semibold cursor-pointer border border-slate-300">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Customer Modal */}
            {showAddCustomerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-900 shadow-xl">
                        <h3 className="font-bold text-lg text-slate-900">Quick Add Customer</h3>

                        <div>
                            <label className="text-xs text-slate-600 font-medium">Customer Full Name *</label>
                            <input
                                type="text"
                                value={newCustName}
                                onChange={(e) => setNewCustName(e.target.value)}
                                placeholder="e.g. Rahim Uddin"
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-600 font-medium">Phone Number *</label>
                            <input
                                type="text"
                                value={newCustPhone}
                                onChange={(e) => setNewCustPhone(e.target.value)}
                                placeholder="017xxxxxxxx"
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-md text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-600 font-medium">Address (Optional)</label>
                            <input
                                type="text"
                                value={newCustAddress}
                                onChange={(e) => setNewCustAddress(e.target.value)}
                                placeholder="City / Area"
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddCustomerModal(false)}
                                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs cursor-pointer font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateCustomerQuick}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer shadow"
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
