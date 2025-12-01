
import React, { useState, useMemo, useEffect } from 'react';
import { Cart, Product } from '../../types';
import { ChevronLeftIcon, PlusIcon, MinusIcon, SearchIcon, XMarkIcon, GlobeIcon } from '../Icons';
import { supabase } from '../../supabaseClient';
import AdoptProductModal from '../AdoptProductModal';

interface MobileAddItemProps {
    cart: Cart;
    products: Product[];
    onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
    onBack: () => void;
    onRefresh: () => void;
    currentCompanyId: string;
}

const MobileAddItem: React.FC<MobileAddItemProps> = ({ cart, products, onUpdateItem, onBack, onRefresh, currentCompanyId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [selectedProductForAdopt, setSelectedProductForAdopt] = useState<Product | null>(null);

    const filteredProducts = useMemo(() => {
        if (showGlobalSearch) return globalProducts;
        if (!searchTerm) return products;
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.sku.toLowerCase().includes(lowerSearch));
    }, [products, searchTerm, showGlobalSearch, globalProducts]);

    useEffect(() => {
        if (showGlobalSearch) {
            fetchGlobalProducts();
        }
    }, [showGlobalSearch, searchTerm]);

    const fetchGlobalProducts = async () => {
        setLoadingGlobal(true);
        let query = supabase
            .from('products')
            .select('*')
            .neq('company_id', currentCompanyId)
            .order('name');

        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching global products:', error);
        } else {
            const mappedData: Product[] = (data || []).map((item: any) => ({
                id: item.id,
                companyId: item.company_id,
                name: item.name,
                sku: item.sku,
                description: item.description,
                unitPrice: item.unit_price,
                imageUrl: item.image_url,
                vendorId: item.vendor_id,
                primaryCategory: item.primary_category,
                secondaryCategory: item.secondary_category,
                rating: item.rating,
                tags: item.tags,
                globalProductId: item.global_product_id
            }));
            setGlobalProducts(mappedData);
        }
        setLoadingGlobal(false);
    };

    const getCartQuantity = (sku: string) => {
        return cart.items?.find(item => item.sku === sku)?.quantity || 0;
    };

    const handleAdd = (product: Product) => {
        console.log('MobileAddItem: handleAdd called', product);
        if (navigator.vibrate) navigator.vibrate(10);
        onUpdateItem(product, 1);
    };

    const handleIncrement = (product: Product, qty: number) => {
        if (navigator.vibrate) navigator.vibrate(5);
        onUpdateItem(product, qty + 1);
    };

    const handleDecrement = (product: Product, qty: number) => {
        if (navigator.vibrate) navigator.vibrate(5);
        onUpdateItem(product, qty - 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col font-sans animate-slide-up bg-gray-50">
            {/* Drag Handle Area */}
            <div className="w-full flex justify-center pt-3 pb-1 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border-t border-gray-200" onClick={onBack}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <header className="bg-white px-4 pb-4 border-b border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{showGlobalSearch ? 'Global Catalog' : 'Add Items'}</h1>
                        <p className="text-xs text-gray-500 mt-0.5">To: {cart.name}</p>
                    </div>
                    <button onClick={onBack} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 active:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={showGlobalSearch ? "Search global products..." : "Search local catalog..."}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 text-base font-medium shadow-sm"
                            autoFocus={!showGlobalSearch}
                        />
                    </div>
                    <button
                        onClick={() => { setShowGlobalSearch(!showGlobalSearch); setSearchTerm(''); }}
                        className={`p-3 rounded-xl border transition-colors ${showGlobalSearch ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
                    >
                        <GlobeIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loadingGlobal && showGlobalSearch ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {filteredProducts.slice(0, 50).map(product => {
                            const quantity = getCartQuantity(product.sku);
                            return (
                                <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
                                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-gray-100 border border-gray-100" />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                                            {showGlobalSearch && (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[80px]">
                                                    {product.companyId}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mb-2">{product.sku}</p>
                                        <p className="font-bold text-blue-600">${product.unitPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {showGlobalSearch ? (
                                            <button
                                                onClick={() => setSelectedProductForAdopt(product)}
                                                className="bg-purple-600 text-white font-bold px-4 py-2 rounded-full text-xs shadow-lg shadow-purple-900/20 active:scale-90 transition-transform"
                                            >
                                                ADOPT
                                            </button>
                                        ) : (
                                            quantity === 0 ? (
                                                <button
                                                    onClick={() => handleAdd(product)}
                                                    className="bg-blue-600 text-white font-bold px-5 py-2 rounded-full text-xs shadow-lg shadow-blue-900/20 active:scale-90 transition-transform"
                                                >
                                                    ADD
                                                </button>
                                            ) : (
                                                <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                                                    <button onClick={() => handleDecrement(product, quantity)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-600 transition-colors active:scale-90 shadow-sm border border-gray-200"><MinusIcon className="w-4 h-4" /></button>
                                                    <span className="text-sm font-bold text-gray-900 w-8 text-center">{quantity}</span>
                                                    <button onClick={() => handleIncrement(product, quantity)} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors active:scale-90 shadow-md"><PlusIcon className="w-4 h-4" /></button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                <p>No products found.</p>
                                {!showGlobalSearch && (
                                    <button
                                        onClick={() => setShowGlobalSearch(true)}
                                        className="mt-4 text-blue-600 font-medium hover:underline"
                                    >
                                        Search Global Catalog
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
                <div className="h-12"></div>
            </main>

            {selectedProductForAdopt && (
                <AdoptProductModal
                    isOpen={!!selectedProductForAdopt}
                    onClose={() => setSelectedProductForAdopt(null)}
                    sourceProduct={selectedProductForAdopt}
                    companyId={currentCompanyId}
                    onSuccess={() => {
                        setSelectedProductForAdopt(null);
                        setShowGlobalSearch(false);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
};

export default MobileAddItem;
