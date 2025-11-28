
import React, { useState, useMemo } from 'react';
import { Product, Company, Cart, CartItem } from '../types';
import { MagnifyingGlassIcon, FunnelIcon, Squares2X2Icon, ListBulletIcon, StarIcon, TagIcon, ShoppingCartIcon, PlusIcon, MinusIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface ProductDashboardProps {
    products: Product[];
    companies: Company[];
    currentCompanyId: string;
    onSwitchCompany?: (companyId: string) => void;
    // New props for Cart integration
    activeCart?: Cart | null;
    onUpdateItem?: (product: { sku: string, name: string, unitPrice: number }, newQuantity: number, note?: string) => void;
    onBack?: () => void;
}

const ProductDashboard: React.FC<ProductDashboardProps> = ({ products, companies, currentCompanyId, onSwitchCompany, activeCart, onUpdateItem, onBack }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

    // Filter products by company first
    const companyProducts = useMemo(() => {
        return products.filter(p => p.companyId === currentCompanyId);
    }, [products, currentCompanyId]);

    // Derived stats
    const stats = useMemo(() => {
        const totalValue = companyProducts.reduce((sum, p) => sum + p.unitPrice, 0);
        const categories = new Set(companyProducts.map(p => p.primaryCategory)).size;
        const vendors = new Set(companyProducts.map(p => p.tags?.[0] || 'Unknown')).size; // Assuming vendor is in tags for now
        return {
            totalProducts: companyProducts.length,
            totalValue,
            categories,
            vendors
        };
    }, [companyProducts]);

    // Filtered list for display
    const filteredProducts = useMemo(() => {
        return companyProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.primaryCategory === selectedCategory;
            const matchesPrice = p.unitPrice >= priceRange[0] && p.unitPrice <= priceRange[1];
            return matchesSearch && matchesCategory && matchesPrice;
        });
    }, [companyProducts, searchQuery, selectedCategory, priceRange]);

    const categories = ['All', ...Array.from(new Set(companyProducts.map(p => p.primaryCategory)))];

    const handleUpdateCartItem = (product: Product, newQuantity: number) => {
        if (onUpdateItem) {
            onUpdateItem({ sku: product.sku, name: product.name, unitPrice: product.unitPrice }, newQuantity);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {onBack && (
                        <button onClick={onBack} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                            Back to Cart
                        </button>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {activeCart ? `Adding to: ${activeCart.name}` : 'Product Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {activeCart ? 'Browse and add products to your cart.' : 'Manage and monitor your product catalog across companies.'}
                    </p>
                </div>

                {/* Company Switcher (if applicable) */}
                {onSwitchCompany && (
                    <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border border-border shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider">Viewing:</span>
                        <select
                            value={currentCompanyId}
                            onChange={(e) => onSwitchCompany(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                        >
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Products" value={stats.totalProducts} icon={<Squares2X2Icon className="w-5 h-5" />} color="bg-blue-500/10 text-blue-500" />
                <StatCard title="Catalog Value" value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<TagIcon className="w-5 h-5" />} color="bg-green-500/10 text-green-500" />
                <StatCard title="Active Categories" value={stats.categories} icon={<ListBulletIcon className="w-5 h-5" />} color="bg-purple-500/10 text-purple-500" />
                <StatCard title="Vendors" value={stats.vendors} icon={<StarIcon className="w-5 h-5" />} color="bg-orange-500/10 text-orange-500" />
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full md:w-96">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search products, SKUs, descriptions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none hover:bg-accent transition-colors cursor-pointer"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div className="flex bg-background border border-border rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <Squares2X2Icon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <ListBulletIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Grid/List */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <MagnifyingGlassIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No products found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            viewMode={viewMode}
                            cartItem={activeCart?.items.find(item => item.sku === product.sku)}
                            onUpdateItem={activeCart ? handleUpdateCartItem : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                {icon}
            </div>
        </div>
    </div>
);

const ProductCard = ({ product, viewMode, cartItem, onUpdateItem }: { product: Product, viewMode: 'grid' | 'list', cartItem?: CartItem, onUpdateItem?: (product: Product, newQuantity: number) => void }) => {
    const quantity = cartItem?.quantity || 0;

    if (viewMode === 'list') {
        return (
            <div className="group flex items-center gap-4 bg-card p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{product.sku} • {product.primaryCategory}</p>
                </div>
                <div className="flex items-center gap-6">
                    <p className="font-bold text-lg text-primary">${product.unitPrice.toFixed(2)}</p>

                    {onUpdateItem ? (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                            {quantity > 0 ? (
                                <>
                                    <button onClick={() => onUpdateItem(product, quantity - 1)} className="p-1 hover:bg-background rounded-md transition-colors"><MinusIcon className="w-4 h-4" /></button>
                                    <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                                    <button onClick={() => onUpdateItem(product, quantity + 1)} className="p-1 hover:bg-background rounded-md transition-colors"><PlusIcon className="w-4 h-4" /></button>
                                </>
                            ) : (
                                <button onClick={() => onUpdateItem(product, 1)} className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                                    <ShoppingCartIcon className="w-4 h-4" /> Add
                                </button>
                            )}
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            In Stock
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
            <div className="relative aspect-square overflow-hidden bg-muted">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-3 right-3">
                    <span className="bg-background/80 backdrop-blur-md text-foreground text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-border/50">
                        {product.primaryCategory}
                    </span>
                </div>

                {/* Overlay on hover (or always visible if items in cart) */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center gap-2 ${quantity > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {onUpdateItem ? (
                        quantity === 0 ? (
                            <button onClick={() => onUpdateItem(product, 1)} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-100 flex items-center gap-2 shadow-lg">
                                <ShoppingCartIcon className="w-4 h-4" /> Add to Cart
                            </button>
                        ) : (
                            <div className="bg-white rounded-full h-10 px-1 flex items-center justify-between text-gray-900 font-bold text-sm shadow-lg min-w-[100px]">
                                <button onClick={() => onUpdateItem(product, quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><MinusIcon className="w-4 h-4" /></button>
                                <span className="w-6 text-center">{quantity}</span>
                                <button onClick={() => onUpdateItem(product, quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                        )
                    ) : (
                        <button className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-100">
                            View Details
                        </button>
                    )}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{product.tags?.[0] || 'Vendor'}</p>
                    <div className="flex items-center text-yellow-500">
                        <StarIcon className="w-3 h-3 fill-current" />
                        <span className="text-xs ml-1 text-foreground font-medium">{product.rating || 4.5}</span>
                    </div>
                </div>
                <h3 className="font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <div>
                        <p className="text-xs text-muted-foreground">Unit Price</p>
                        <p className="text-lg font-bold text-primary">${product.unitPrice.toFixed(2)}</p>
                    </div>
                    {quantity > 0 && (
                        <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {quantity} in cart
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDashboard;
