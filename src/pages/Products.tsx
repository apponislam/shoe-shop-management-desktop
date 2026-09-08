import React, { useEffect, useState } from "react";
import { Plus, Search, Layers, Tag, Ruler, Palette, Box } from "lucide-react";
import { useToast } from "../components/Toast";

interface ProductsProps {
    currencySymbol: string;
}

export const Products: React.FC<ProductsProps> = ({ currencySymbol }) => {
    const { toast } = useToast();
    const [activeSubTab, setActiveSubTab] = useState<"products" | "categories" | "brands" | "sizes" | "colors">("products");
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Create Modal States
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterNameInput, setMasterNameInput] = useState("");
    const [masterExtraInput, setMasterExtraInput] = useState("");

    // New Product Form State
    const [newProductName, setNewProductName] = useState("");
    const [newProductSku, setNewProductSku] = useState("");
    const [newProductCategory, setNewProductCategory] = useState<number>(0);
    const [newProductBrand, setNewProductBrand] = useState<number>(0);

    // Variants input state for new product
    const [newVariants, setNewVariants] = useState<
        Array<{
            sizeId?: number;
            colorId?: number;
            sku: string;
            barcode: string;
            purchasePrice: number;
            sellingPrice: number;
            stock: number;
            minimumStock: number;
        }>
    >([
        {
            sku: `SKU-${Date.now().toString().slice(-4)}`,
            barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            purchasePrice: 1500,
            sellingPrice: 2500,
            stock: 10,
            minimumStock: 2,
        },
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [p, c, b, s, col] = await Promise.all([
                window.electronAPI.getProducts(),
                window.electronAPI.getCategories(),
                window.electronAPI.getBrands(),
                window.electronAPI.getSizes(),
                window.electronAPI.getColors(),
            ]);

            setProducts(p || []);
            setCategories(c || []);
            setBrands(b || []);
            setSizes(s || []);
            setColors(col || []);

            if (c && c.length > 0) setNewProductCategory(c[0].id);
            if (b && b.length > 0) setNewProductBrand(b[0].id);
        } catch (err) {
            console.error("Failed to load products page data:", err);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        const res = await window.electronAPI.getProducts({ search: query });
        setProducts(res || []);
    };

    const handleCreateProduct = async () => {
        if (!newProductName.trim() || !newProductCategory) {
            toast.error("Product Name and Category are required!");
            return;
        }

        try {
            await window.electronAPI.createProduct({
                name: newProductName,
                sku: newProductSku || `PROD-${Date.now().toString().slice(-4)}`,
                categoryId: newProductCategory,
                brandId: newProductBrand || undefined,
                variants: newVariants,
            });

            setShowAddProductModal(false);
            setNewProductName("");
            setNewProductSku("");
            toast.success("Product created successfully!");
            loadData();
        } catch (err: any) {
            toast.error(`Failed to save product: ${err.message || err}`);
        }
    };

    const addVariantRow = () => {
        setNewVariants([
            ...newVariants,
            {
                sku: `SKU-${Date.now().toString().slice(-4)}-${newVariants.length + 1}`,
                barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                purchasePrice: 1500,
                sellingPrice: 2500,
                stock: 10,
                minimumStock: 2,
            },
        ]);
    };

    // Edit Master Modal States
    const [editingMasterItem, setEditingMasterItem] = useState<any | null>(null);

    // Edit Product Modal States
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [editProductName, setEditProductName] = useState("");

    const handleDeleteProduct = async (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete product "${name}"?`)) {
            try {
                await window.electronAPI.deleteProduct(id);
                loadData();
            } catch (err: any) {
                alert(`Failed to delete product: ${err.message || err}`);
            }
        }
    };

    const handleDeleteVariant = async (variantId: number) => {
        if (confirm("Are you sure you want to delete this size variant?")) {
            try {
                await window.electronAPI.deleteVariant(variantId);
                loadData();
            } catch (err: any) {
                alert(`Failed to delete variant: ${err.message || err}`);
            }
        }
    };

    const handleDeleteMasterItem = async (id: number, name: string) => {
        const itemType = activeSubTab.slice(0, -1);
        if (confirm(`Are you sure you want to delete ${itemType} "${name}"?`)) {
            try {
                if (activeSubTab === "categories") await window.electronAPI.deleteCategory(id);
                else if (activeSubTab === "brands") await window.electronAPI.deleteBrand(id);
                else if (activeSubTab === "sizes") await window.electronAPI.deleteSize(id);
                else if (activeSubTab === "colors") await window.electronAPI.deleteColor(id);
                loadData();
            } catch (err: any) {
                alert(`Failed to delete ${itemType}: ${err.message || err}`);
            }
        }
    };

    const openEditMasterModal = (item: any) => {
        setEditingMasterItem(item);
        setMasterNameInput(item.name || "");
        setMasterExtraInput(item.hexCode || item.sortOrder?.toString() || item.description || "");
        setShowMasterModal(true);
    };

    const handleSaveMasterItem = async () => {
        if (!masterNameInput.trim()) return;

        try {
            if (editingMasterItem) {
                if (activeSubTab === "categories") {
                    await window.electronAPI.updateCategory(editingMasterItem.id, { name: masterNameInput.trim() });
                } else if (activeSubTab === "brands") {
                    await window.electronAPI.updateBrand(editingMasterItem.id, { name: masterNameInput.trim() });
                } else if (activeSubTab === "sizes") {
                    await window.electronAPI.updateSize(editingMasterItem.id, { name: masterNameInput.trim(), sortOrder: parseInt(masterExtraInput) || 0 });
                } else if (activeSubTab === "colors") {
                    await window.electronAPI.updateColor(editingMasterItem.id, { name: masterNameInput.trim(), hexCode: masterExtraInput.trim() });
                }
            } else {
                if (activeSubTab === "categories") {
                    await window.electronAPI.createCategory({ name: masterNameInput.trim() });
                } else if (activeSubTab === "brands") {
                    await window.electronAPI.createBrand({ name: masterNameInput.trim() });
                } else if (activeSubTab === "sizes") {
                    await window.electronAPI.createSize({ name: masterNameInput.trim(), sortOrder: parseInt(masterExtraInput) || 0 });
                } else if (activeSubTab === "colors") {
                    await window.electronAPI.createColor({ name: masterNameInput.trim(), hexCode: masterExtraInput.trim() });
                }
            }

            setShowMasterModal(false);
            setEditingMasterItem(null);
            setMasterNameInput("");
            setMasterExtraInput("");
            loadData();
        } catch (err: any) {
            alert(`Failed to save ${activeSubTab}: ${err.message || err}`);
        }
    };

    const openEditProductModal = (product: any) => {
        setEditingProduct(product);
        setEditProductName(product.name);
    };

    const handleSaveEditProduct = async () => {
        if (!editingProduct || !editProductName.trim()) return;
        try {
            await window.electronAPI.updateProduct(editingProduct.id, { name: editProductName.trim() });
            setEditingProduct(null);
            loadData();
        } catch (err: any) {
            alert(`Error updating product: ${err.message || err}`);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Attributes</h1>
                    <p className="text-sm text-slate-500">Manage shoe models, size variants, categories, and pricing</p>
                </div>

                <div className="flex items-center gap-3">
                    {activeSubTab === "products" ? (
                        <button
                            onClick={() => setShowAddProductModal(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                        >
                            <Plus className="w-4 h-4 text-white" /> Add Shoe Model
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setEditingMasterItem(null);
                                setMasterNameInput("");
                                setMasterExtraInput("");
                                setShowMasterModal(true);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer capitalize shadow"
                        >
                            <Plus className="w-4 h-4 text-white" /> Add {activeSubTab.slice(0, -1)}
                        </button>
                    )}
                </div>
            </div>

            {/* Subtabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                {[
                    { id: "products", label: "All Products & Variants", icon: <Box className="w-4 h-4" /> },
                    { id: "categories", label: "Categories", icon: <Layers className="w-4 h-4" /> },
                    { id: "brands", label: "Brands", icon: <Tag className="w-4 h-4" /> },
                    { id: "sizes", label: "Sizes", icon: <Ruler className="w-4 h-4" /> },
                    { id: "colors", label: "Colors", icon: <Palette className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeSubTab === tab.id
                                ? "bg-slate-900 text-white border border-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200"
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content per subtab */}
            {activeSubTab === "products" && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by product name, SKU, or barcode..."
                            className="w-full bg-white border border-slate-300 text-slate-900 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-xs"
                        />
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                            {product.category?.name}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-base mt-1">{product.name}</h3>
                                        <div className="text-xs text-slate-500 font-medium">{product.brand?.name || "No Brand"}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[11px] font-mono text-slate-500 font-semibold">{product.sku}</span>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <button
                                                onClick={() => openEditProductModal(product)}
                                                className="text-[10px] text-slate-700 hover:text-slate-900 font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer border border-slate-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold px-2 py-0.5 bg-rose-50 hover:bg-rose-100 rounded cursor-pointer border border-rose-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Variants Table */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Available Size Variants:</div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                        {product.variants?.map((v: any) => (
                                            <div key={v.id} className="bg-slate-50 p-2 rounded text-xs flex items-center justify-between border border-slate-200">
                                                <div>
                                                    <span className="font-bold text-slate-900">{v.size ? `Size ${v.size.name}` : "Standard"}</span>
                                                    {v.color && <span className="text-slate-600 ml-1">({v.color.name})</span>}
                                                    <div className="text-[10px] text-slate-500 font-mono">Barcode: {v.barcode || v.sku}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <div className="font-extrabold text-slate-900">{currencySymbol} {Number(v.sellingPrice).toLocaleString()}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">Stock: <span className="font-bold text-slate-900">{v.stock}</span></div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteVariant(v.id)}
                                                        className="text-[10px] text-rose-600 hover:text-rose-700 p-1 cursor-pointer font-bold"
                                                        title="Delete Variant"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories / Brands / Sizes / Colors Tables */}
            {activeSubTab !== "products" && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Details / Value</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activeSubTab === "categories"
                                ? categories
                                : activeSubTab === "brands"
                                ? brands
                                : activeSubTab === "sizes"
                                ? sizes
                                : colors
                            ).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500 font-medium">#{item.id}</td>
                                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                        {item.description || item.hexCode || (item.sortOrder !== undefined ? `Sort: ${item.sortOrder}` : "N/A")}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => openEditMasterModal(item)}
                                            className="text-xs text-slate-700 hover:text-slate-900 font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer border border-slate-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMasterItem(item.id, item.name)}
                                            className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded cursor-pointer border border-rose-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Quick Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
                        <h3 className="font-bold text-slate-900 text-base">Edit Product Name</h3>
                        <div>
                            <label className="text-xs text-slate-500">Product Name</label>
                            <input
                                type="text"
                                value={editProductName}
                                onChange={(e) => setEditProductName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingProduct(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={handleSaveEditProduct} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Master Add/Edit Modal */}
            {showMasterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-900">
                        <h3 className="font-bold text-lg capitalize">{editingMasterItem ? "Edit" : "Add New"} {activeSubTab.slice(0, -1)}</h3>
                        <div>
                            <label className="text-xs text-slate-500 font-medium">Name *</label>
                            <input
                                type="text"
                                value={masterNameInput}
                                onChange={(e) => setMasterNameInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                            />
                        </div>
                        {activeSubTab === "sizes" && (
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Sort Order (Number)</label>
                                <input
                                    type="number"
                                    value={masterExtraInput}
                                    onChange={(e) => setMasterExtraInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                                />
                            </div>
                        )}
                        {activeSubTab === "colors" && (
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Hex Color Code (Optional)</label>
                                <input
                                    type="text"
                                    value={masterExtraInput}
                                    onChange={(e) => setMasterExtraInput(e.target.value)}
                                    placeholder="#000000"
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 focus:outline-none"
                                />
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowMasterModal(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 text-xs cursor-pointer">
                                Cancel
                            </button>
                            <button onClick={handleSaveMasterItem} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow cursor-pointer">
                                Save {activeSubTab.slice(0, -1)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <h3 className="font-bold text-lg text-slate-900">Add New Shoe Model & Variants</h3>
                            <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-900 font-bold cursor-pointer">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Shoe Model Name *</label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    placeholder="e.g. Air Max Runner"
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Product SKU</label>
                                <input
                                    type="text"
                                    value={newProductSku}
                                    onChange={(e) => setNewProductSku(e.target.value)}
                                    placeholder="e.g. NK-AIR-001"
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Category *</label>
                                <select
                                    value={newProductCategory}
                                    onChange={(e) => setNewProductCategory(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 font-medium"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium">Brand</label>
                                <select
                                    value={newProductBrand}
                                    onChange={(e) => setNewProductBrand(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded text-sm mt-1 font-medium"
                                >
                                    <option value={0}>Select Brand</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Variants Builder */}
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Size & Color Variants *</label>
                                <button
                                    type="button"
                                    onClick={addVariantRow}
                                    className="text-xs text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold px-3 py-1 rounded cursor-pointer"
                                >
                                    + Add Size Variant
                                </button>
                            </div>

                            {newVariants.map((v, index) => (
                                <div key={index} className="bg-slate-50 border border-slate-200 p-3 rounded-lg grid grid-cols-6 gap-2 text-xs items-center">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Size</label>
                                        <select
                                            value={v.sizeId || ""}
                                            onChange={(e) => {
                                                const updated = [...newVariants];
                                                updated[index].sizeId = e.target.value ? Number(e.target.value) : undefined;
                                                setNewVariants(updated);
                                            }}
                                            className="w-full bg-white border border-slate-300 text-slate-900 p-1.5 rounded"
                                        >
                                            <option value="">Select Size</option>
                                            {sizes.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Color</label>
                                        <select
                                            value={v.colorId || ""}
                                            onChange={(e) => {
                                                const updated = [...newVariants];
                                                updated[index].colorId = e.target.value ? Number(e.target.value) : undefined;
                                                setNewVariants(updated);
                                            }}
                                            className="w-full bg-white border border-slate-300 text-slate-900 p-1.5 rounded"
                                        >
                                            <option value="">Select Color</option>
                                            {colors.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Selling Price ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            value={v.sellingPrice}
                                            onChange={(e) => {
                                                const updated = [...newVariants];
                                                updated[index].sellingPrice = parseFloat(e.target.value) || 0;
                                                setNewVariants(updated);
                                            }}
                                            className="w-full bg-white border border-slate-300 text-slate-900 p-1.5 rounded font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Initial Stock</label>
                                        <input
                                            type="number"
                                            value={v.stock}
                                            onChange={(e) => {
                                                const updated = [...newVariants];
                                                updated[index].stock = parseInt(e.target.value) || 0;
                                                setNewVariants(updated);
                                            }}
                                            className="w-full bg-white border border-slate-300 text-slate-900 p-1.5 rounded font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-slate-500 font-medium">Barcode / SKU</label>
                                        <input
                                            type="text"
                                            value={v.barcode}
                                            onChange={(e) => {
                                                const updated = [...newVariants];
                                                updated[index].barcode = e.target.value;
                                                setNewVariants(updated);
                                            }}
                                            className="w-full bg-white border border-slate-300 text-slate-900 p-1.5 rounded font-mono"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-3">
                                        {newVariants.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setNewVariants(newVariants.filter((_, i) => i !== index))}
                                                className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                            <button
                                onClick={() => setShowAddProductModal(false)}
                                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 text-xs cursor-pointer font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-pointer shadow"
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
