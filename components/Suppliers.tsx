
import React, { useState, useMemo, useEffect } from 'react';
import { Vendor, Order, PurchaseOrder, Product, VendorAccount, Property } from '../types';
import { ChevronRightIcon, SparklesIcon, PlusIcon, ArrowUpTrayIcon, Squares2X2Icon, Bars3Icon, XMarkIcon, SearchIcon, UserGroupIcon, SupplierIcon } from './Icons';
import { Select } from './ui/Select';
import { GoogleGenAI } from "@google/genai";
import AddProductModal from './AddProductModal';
import { usePermissions } from '../contexts/PermissionsContext';

interface SuppliersProps {
    vendors: Vendor[];
    products: Product[];
    orders: Order[];
    properties: Property[];
    onSelectOrder: (order: Order) => void;
    onAddVendor: (vendorData: { name: string; phone?: string; email?: string; }) => void;
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onAddVendorAccount: (vendorId: string, accountData: { propertyId: string, accountNumber: string }) => void;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col overflow-hidden transition-transform hover:scale-[1.02] group">
            <div className="relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-sm text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex-grow line-clamp-2">{product.description}</p>
                <div className="text-right mt-3">
                    <span className="font-bold text-md text-primary">${product.unitPrice.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// ... (Modals remain mostly the same, assuming they are rendered on top of a dark overlay)
// Note: Modals often have their own specific styling. If they use standard Tailwind classes like bg-white text-black, they are fine in light mode.
// If they use hardcoded dark theme colors, they need updating.
// Let's update AddVendorModal just in case to be consistent.

const AddVendorModal: React.FC<{ onClose: () => void; onSave: (data: { name: string, phone: string, email: string }) => void; }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Add New Vendor</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="vendorName" className="block text-sm font-medium mb-1">Vendor Name *</label>
                        <input
                            type="text"
                            id="vendorName"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="vendorPhone" className="block text-sm font-medium mb-1">Phone</label>
                        <input
                            type="tel"
                            id="vendorPhone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="vendorEmail" className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            id="vendorEmail"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                    <button onClick={() => { if (name.trim()) { onSave({ name: name.trim(), phone, email }); onClose(); } }} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:opacity-50 disabled:cursor-not-allowed" disabled={!name.trim()}>Save Vendor</button>
                </div>
            </div>
        </div>
    );
}

const BulkImportModal: React.FC<{ onClose: () => void; type: 'Vendors' | 'Products' }> = ({ onClose, type }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Bulk Import {type}</h2>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Paste your data here in CSV format. Each {type === 'Vendors' ? 'vendor' : 'product'} should be on a new line.</p>
                <p className="text-xs text-muted-foreground font-mono p-3 bg-muted/50 rounded-lg border border-border">
                    {type === 'Vendors' ? 'Example: Vendor Name,800-555-1234,contact@vendor.com\nAnother Vendor,,sales@another.com' : 'Example: Name,SKU,Desc,Price,PrimaryCat,SecondaryCat\nItem 1,SKU001,Desc 1,99.99,Electronics,Monitors'}
                </p>
                <textarea
                    rows={8}
                    className="mt-4 block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
            </div>
            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                <button onClick={onClose} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent">Import Data</button>
            </div>
        </div>
    </div>
);

const AddAccountModal: React.FC<{
    onClose: () => void;
    onSave: (vendorId: string, data: { propertyId: string; accountNumber: string; }) => void;
    properties: Property[];
    vendorId: string;
}> = ({ onClose, onSave, properties, vendorId }) => {
    const [propertyId, setPropertyId] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    const handleSave = () => {
        if (propertyId && accountNumber.trim()) {
            onSave(vendorId, { propertyId, accountNumber: accountNumber.trim() });
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Add New Account</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="property" className="block text-sm font-medium mb-1">Property *</label>
                        <Select
                            id="property"
                            value={propertyId}
                            onChange={e => setPropertyId(e.target.value)}
                            required
                            className="w-full"
                        >
                            <option value="" disabled>Select a property</option>
                            {properties.map(prop => <option key={prop.id} value={prop.id}>{prop.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium mb-1">Account Number *</label>
                        <input
                            type="text"
                            id="accountNumber"
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                    <button onClick={handleSave} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:opacity-50 disabled:cursor-not-allowed" disabled={!propertyId || !accountNumber.trim()}>Save Account</button>
                </div>
            </div>
        </div>
    );
};


import ProductDashboard from './ProductDashboard';
import { Company } from '../types';

interface SuppliersProps {
    vendors: Vendor[];
    products: Product[];
    orders: Order[];
    properties: Property[];
    companies: Company[];
    currentCompanyId: string;
    onSwitchCompany?: (companyId: string) => void;
    onSelectOrder: (order: Order) => void;
    onAddVendor: (vendorData: { name: string; phone?: string; email?: string; }) => void;
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onAddVendorAccount: (vendorId: string, accountData: { propertyId: string, accountNumber: string }) => void;
}

// ... (ProductCard, AddVendorModal, BulkImportModal, AddAccountModal components remain unchanged)

const Suppliers: React.FC<SuppliersProps> = ({ vendors, products, orders, onSelectOrder, onAddVendor, onAddProduct, onAddVendorAccount, properties, companies, currentCompanyId, onSwitchCompany }) => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'vendors'>('dashboard');
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(vendors[0] || null);
    const [activeTab, setActiveTab] = useState<'pos' | 'catalog' | 'ai' | 'accounts'>('pos');
    const [poSearchTerm, setPoSearchTerm] = useState('');
    const [catalogView, setCatalogView] = useState<'card' | 'list'>('card');
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('All');

    // Modal states
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [isBulkImportVendorsOpen, setIsBulkImportVendorsOpen] = useState(false);
    const [isBulkImportProductsOpen, setIsBulkImportProductsOpen] = useState(false);

    // AI state
    const [analysis, setAnalysis] = useState('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const { can } = usePermissions();
    const canCreate = can('suppliers:create');
    const canEdit = can('suppliers:edit');

    // Keep local state in sync with props
    useEffect(() => {
        if (selectedVendor) {
            const updatedVendor = vendors?.find(v => v.id === selectedVendor.id);
            setSelectedVendor(updatedVendor || null);
        } else if (vendors.length > 0) {
            setSelectedVendor(vendors[0]);
        }
    }, [vendors]);

    const unfilteredVendorPurchaseOrders = useMemo(() => {
        if (!selectedVendor) return [];
        return orders.flatMap(order =>
            (order.purchaseOrders || [])
                .filter(po => po.vendorId === selectedVendor.id)
                .map(po => ({ ...po, parentOrder: order }))
        );
    }, [selectedVendor, orders]);

    const vendorPurchaseOrders = useMemo(() => {
        if (!poSearchTerm) return unfilteredVendorPurchaseOrders;
        const lowerSearch = poSearchTerm.toLowerCase();
        return unfilteredVendorPurchaseOrders.filter(po =>
            po.id.toLowerCase().includes(lowerSearch) ||
            po.parentOrder.cartName.toLowerCase().includes(lowerSearch)
        );
    }, [unfilteredVendorPurchaseOrders, poSearchTerm]);


    const unfilteredVendorCatalog = useMemo(() => {
        if (!selectedVendor) {
            console.log("DEBUG: No selected vendor");
            return [];
        }
        console.log("DEBUG: Filtering products for vendor:", selectedVendor.id, selectedVendor.name);
        console.log("DEBUG: Total products available:", products.length);
        const filtered = products.filter(p => {
            const isPrimary = p.vendorId === selectedVendor.id;
            const isOption = p.vendorOptions?.some(opt => opt.vendorId === selectedVendor.id);
            return isPrimary || isOption;
        });
        console.log("DEBUG: Matching products found:", filtered.length);
        return filtered;
    }, [selectedVendor, products]);

    const vendorCatalogCategories = useMemo(() => {
        const categories = new Set(unfilteredVendorCatalog.map(p => p.primaryCategory));
        return ['All', ...Array.from(categories)];
    }, [unfilteredVendorCatalog]);

    const vendorCatalog = useMemo(() => {
        return unfilteredVendorCatalog.filter(p => {
            const matchesCategory = catalogCategoryFilter === 'All' || p.primaryCategory === catalogCategoryFilter;
            const lowerSearch = catalogSearchTerm.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(lowerSearch) || (p.sku && p.sku.toLowerCase().includes(lowerSearch));
            return matchesCategory && matchesSearch;
        });
    }, [unfilteredVendorCatalog, catalogCategoryFilter, catalogSearchTerm]);


    const handleGenerateAnalysis = async () => {
        if (!selectedVendor) return;

        setLoadingAnalysis(true);
        setAnalysis('');
        setAnalysisError(null);

        const totalSpend = unfilteredVendorPurchaseOrders.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0), 0);
        const poHistoryString = unfilteredVendorPurchaseOrders.map(po => ` - PO #${po.id} (${po.parentOrder.submissionDate}): ${po.items.length} items, Status: ${po.status}`).join('\n');

        const prompt = `You are a procurement analyst AI. Based on the following data for the vendor "${selectedVendor.name}", provide a brief analysis.\n\nPurchase Order History:\n${poHistoryString || 'No purchase orders on record.'}\n\nTotal Spend across these POs: $${totalSpend.toFixed(2)}\n\nInclude the following in your analysis:\n- A summary of their total business value from these POs.\n- Any observable patterns in purchasing.\n- A concluding sentence about their importance as a supplier based on this data.\n\nKeep the analysis concise, professional, and formatted in clear paragraphs. Do not use markdown formatting like headers or lists.`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAnalysis(result.text || '');
        } catch (e: any) {
            console.error("Gemini API call failed:", e);
            setAnalysisError(e.message || "An error occurred while generating the analysis.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleSaveNewProduct = (productData: Omit<Product, 'id' | 'vendorId' | 'imageUrl'>) => {
        if (!selectedVendor) return;
        onAddProduct({
            ...productData,
            vendorId: selectedVendor.id,
            imageUrl: `https://picsum.photos/seed/newprod${Date.now()}/400/300`,
        });
        setIsAddProductOpen(false);
    };

    useEffect(() => {
        setAnalysis('');
        setAnalysisError(null);
        setLoadingAnalysis(false);
        setActiveTab('pos');
        setCatalogSearchTerm('');
        setCatalogCategoryFilter('All');
        setPoSearchTerm('');
    }, [selectedVendor]);

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground mt-2">Manage vendor information, purchase orders, and catalogs.</p>
                </div>
                <div className="flex bg-muted p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${viewMode === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('vendors')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${viewMode === 'vendors' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Vendor Management
                    </button>
                </div>
            </div>

            {viewMode === 'dashboard' ? (
                <ProductDashboard
                    products={products}
                    companies={companies}
                    currentCompanyId={currentCompanyId}
                    onSwitchCompany={onSwitchCompany}
                />
            ) : (
                <div className="flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full md:w-1/3 lg:w-1/4 bg-card p-4 rounded-2xl shadow-lg border border-border">
                        <h2 className="text-lg font-bold text-foreground mb-3 px-2">All Suppliers</h2>
                        <ul className="space-y-1 mb-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                            {vendors.map(vendor => (
                                <li key={vendor.id}>
                                    <button onClick={() => setSelectedVendor(vendor)} className={`w-full text-left p-3 rounded-lg font-semibold transition-all duration-200 text-sm ${selectedVendor?.id === vendor.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                                        {vendor.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {canCreate && (
                            <div className="pt-3 border-t border-border space-y-2">
                                <button onClick={() => setIsAddVendorOpen(true)} className="flex items-center gap-2 w-full text-sm font-semibold text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors"><PlusIcon className="w-5 h-5" /> Add Vendor</button>
                                <button onClick={() => setIsBulkImportVendorsOpen(true)} className="flex items-center gap-2 w-full text-sm font-semibold text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors"><ArrowUpTrayIcon className="w-5 h-5" /> Bulk Import</button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        {selectedVendor ? (
                            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
                                <h2 className="text-2xl font-bold text-foreground">{selectedVendor.name}</h2>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-1 mb-4">
                                    {selectedVendor.email && <span>Email: <a href={`mailto:${selectedVendor.email}`} className="font-medium text-primary hover:underline">{selectedVendor.email}</a></span>}
                                    {selectedVendor.phone && <span>Phone: <span className="font-medium text-foreground">{selectedVendor.phone}</span></span>}
                                </div>
                                <div className="border-b border-border">
                                    <nav className="-mb-px flex space-x-6">
                                        <button onClick={() => setActiveTab('pos')} className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'pos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Purchase Orders ({unfilteredVendorPurchaseOrders.length})</button>
                                        <button onClick={() => setActiveTab('catalog')} className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'catalog' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Catalog ({unfilteredVendorCatalog.length})</button>
                                        <button onClick={() => setActiveTab('accounts')} className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${activeTab === 'accounts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}><UserGroupIcon className="w-5 h-5" />Account Info</button>
                                        <button onClick={() => setActiveTab('ai')} className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${activeTab === 'ai' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}><SparklesIcon className="w-5 h-5" />AI Insights</button>
                                    </nav>
                                </div>

                                <div className="mt-6">
                                    {activeTab === 'pos' && (
                                        <div>
                                            <div className="mb-4">
                                                <div className="relative">
                                                    <SearchIcon className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input type="text" placeholder="Search PO # or Order Name..." value={poSearchTerm} onChange={e => setPoSearchTerm(e.target.value)} className="w-full max-w-sm pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-primary focus:border-primary text-sm text-foreground placeholder-muted-foreground" />
                                                </div>
                                            </div>
                                            {vendorPurchaseOrders.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left">PO #</th>
                                                                <th className="px-4 py-3 text-left">Order Name</th>
                                                                <th className="px-4 py-3 text-center">Status</th>
                                                                <th className="px-4 py-3 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {vendorPurchaseOrders.map(po => (
                                                                <tr key={po.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onSelectOrder(po.parentOrder)}>
                                                                    <td className="px-4 py-3 font-mono font-bold text-primary">{po.id}</td>
                                                                    <td className="px-4 py-3 font-semibold text-foreground">{po.parentOrder.cartName}</td>
                                                                    <td className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">{po.status}</td>
                                                                    <td className="px-4 py-3"><ChevronRightIcon className="w-5 h-5 text-muted-foreground" /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : <p className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">{unfilteredVendorPurchaseOrders.length > 0 ? 'No purchase orders match your search.' : 'No purchase orders found for this supplier.'}</p>}
                                        </div>
                                    )}

                                    {activeTab === 'catalog' && (
                                        <div>
                                            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                                                {canCreate && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 px-3 py-1.5 rounded-lg transition-colors shadow-lg active:scale-95"><PlusIcon className="w-5 h-5" /> Add Product</button>
                                                        <button onClick={() => setIsBulkImportProductsOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors border border-border"><ArrowUpTrayIcon className="w-5 h-5" /> Import</button>
                                                    </div>
                                                )}
                                                {unfilteredVendorCatalog.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <input type="text" placeholder="Search catalog..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="w-48 px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary placeholder-muted-foreground" />
                                                        <Select value={catalogCategoryFilter} onChange={e => setCatalogCategoryFilter(e.target.value)} className="w-40">
                                                            {vendorCatalogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                        </Select>
                                                        <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
                                                            <button onClick={() => setCatalogView('card')} className={`p-1.5 rounded-md transition-colors ${catalogView === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Squares2X2Icon className="w-5 h-5" /></button>
                                                            <button onClick={() => setCatalogView('list')} className={`p-1.5 rounded-md transition-colors ${catalogView === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Bars3Icon className="w-5 h-5" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {vendorCatalog.length > 0 ? (
                                                catalogView === 'card' ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{vendorCatalog.map(product => (<ProductCard key={product.id} product={product} />))}</div>
                                                ) : (
                                                    <div className="overflow-x-auto bg-muted/10 rounded-xl border border-border"><table className="w-full text-sm"><thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border"><tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">SKU</th><th className="px-4 py-3 text-right">Price</th></tr></thead><tbody className="divide-y divide-border text-foreground">{vendorCatalog.map(p => {
                                                        const vendorOption = p.vendorOptions?.find(vo => vo.vendorId === selectedVendor.id);
                                                        const displayPrice = vendorOption ? vendorOption.price : p.unitPrice;
                                                        return (
                                                            <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                                                <td className="px-4 py-3 font-semibold">{p.name}</td>
                                                                <td className="px-4 py-3 font-mono text-muted-foreground">{p.sku}</td>
                                                                <td className="px-4 py-3 font-semibold text-right text-green-600 dark:text-green-400">${displayPrice.toFixed(2)}</td>
                                                            </tr>
                                                        );
                                                    })}</tbody></table></div>
                                                )
                                            ) : <p className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">{unfilteredVendorCatalog.length > 0 ? 'No items match your filter.' : 'No catalog items found for this supplier.'}</p>}
                                        </div>
                                    )}

                                    {activeTab === 'accounts' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-foreground">Vendor Account Numbers</h3>
                                                {canEdit && <button onClick={() => setIsAddAccountOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 px-3 py-1.5 rounded-lg transition-colors shadow-lg active:scale-95"><PlusIcon className="w-5 h-5" /> Add Account</button>}
                                            </div>
                                            {selectedVendor.accounts && selectedVendor.accounts.length > 0 ? (
                                                <div className="overflow-x-auto border border-border rounded-xl bg-muted/10">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left">Property</th>
                                                                <th className="px-4 py-3 text-left">Account Number</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {selectedVendor.accounts.map(acc => (
                                                                <tr key={acc.id} className="hover:bg-muted/50 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-foreground">{properties?.find(p => p.id === acc.propertyId)?.name || 'Unknown Property'}</td>
                                                                    <td className="px-4 py-3 font-mono text-muted-foreground">{acc.accountNumber}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No account numbers have been added for this vendor.</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'ai' && (
                                        <div className="min-h-[20rem] flex flex-col">
                                            {!analysis && !loadingAnalysis && !analysisError && (<div className="text-center m-auto"><div className="bg-green-500/10 dark:bg-green-500/20 p-4 rounded-full inline-block border border-green-500/20 dark:border-green-500/30 mb-4"><SparklesIcon className="w-10 h-10 text-green-600 dark:text-green-400" /></div><h3 className="text-lg font-bold text-foreground">Unlock Vendor Insights</h3><p className="mt-1 text-muted-foreground max-w-sm mx-auto">Generate an AI-powered summary of this vendor's activity, spending patterns, and business value.</p><button onClick={handleGenerateAnalysis} className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-200 active:scale-95 shadow-lg">Generate Analysis</button></div>)}
                                            {loadingAnalysis && (<div className="text-center m-auto"><svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4 text-muted-foreground font-medium">Analyzing vendor data...</p></div>)}
                                            {analysisError && (<div className="m-auto text-center bg-red-500/10 p-8 rounded-2xl border border-red-500/30"><h4 className="font-bold text-red-500 text-lg">Analysis Failed</h4><p className="text-sm text-red-400 mt-2 mb-4">{analysisError}</p><button onClick={handleGenerateAnalysis} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg text-sm hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20">Try Again</button></div>)}
                                            {analysis && (
                                                <div className="bg-muted/30 p-6 rounded-2xl border border-border shadow-sm">
                                                    <div className="prose prose-sm prose-invert dark:prose-invert max-w-none text-foreground leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
                                                    <div className="mt-6 flex justify-end">
                                                        <button onClick={handleGenerateAnalysis} className="bg-muted text-foreground font-bold py-2 px-4 rounded-lg text-sm hover:bg-muted/80 transition-colors border border-border">Regenerate</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                                <SupplierIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-bold text-foreground">Select a supplier</h3>
                                <p className="mt-1 text-muted-foreground">Choose a supplier from the list to see their details.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isAddVendorOpen && <AddVendorModal onClose={() => setIsAddVendorOpen(false)} onSave={onAddVendor} />}
            {isAddProductOpen && <AddProductModal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} onSave={handleSaveNewProduct} allProducts={products} />}
            {isAddAccountOpen && selectedVendor && <AddAccountModal onClose={() => setIsAddAccountOpen(false)} onSave={onAddVendorAccount} properties={properties} vendorId={selectedVendor.id} />}
            {isBulkImportVendorsOpen && <BulkImportModal onClose={() => setIsBulkImportVendorsOpen(false)} type="Vendors" />}
            {isBulkImportProductsOpen && <BulkImportModal onClose={() => setIsBulkImportProductsOpen(false)} type="Products" />}
        </>
    );
};

export default Suppliers;
