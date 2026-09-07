import { useEffect, useState } from "react";
import { Navigation } from "./components/Navigation";
import type { NavTab } from "./components/Navigation";
import { Dashboard } from "./pages/Dashboard";
import { POS } from "./pages/POS";
import { Products } from "./pages/Products";
import { Stock } from "./pages/Stock";
import { Purchases } from "./pages/Purchases";
import { CustomersSuppliers } from "./pages/CustomersSuppliers";
import { Expenses } from "./pages/Expenses";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

export function App() {
    const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
    const [shopName, setShopName] = useState("Shoe Shop Management");
    const [currencySymbol, setCurrencySymbol] = useState("৳");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            if (window.electronAPI) {
                const s = await window.electronAPI.getSettings();
                if (s) {
                    if (s.shopName) setShopName(s.shopName);
                    if (s.currencySymbol) setCurrencySymbol(s.currencySymbol);
                }
            }
        } catch (err) {
            console.error("Failed to load settings in App:", err);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
            {/* Sidebar Navigation */}
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} shopName={shopName} />

            {/* Main Active Page View */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
                {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} currencySymbol={currencySymbol} />}
                {activeTab === "pos" && <POS currencySymbol={currencySymbol} />}
                {activeTab === "products" && <Products currencySymbol={currencySymbol} />}
                {activeTab === "stock" && <Stock currencySymbol={currencySymbol} />}
                {activeTab === "purchases" && <Purchases currencySymbol={currencySymbol} />}
                {activeTab === "customers-suppliers" && <CustomersSuppliers currencySymbol={currencySymbol} />}
                {activeTab === "expenses" && <Expenses currencySymbol={currencySymbol} />}
                {activeTab === "reports" && <Reports currencySymbol={currencySymbol} />}
                {activeTab === "settings" && <Settings onSettingsSaved={loadSettings} />}
            </main>
        </div>
    );
}

export default App;
