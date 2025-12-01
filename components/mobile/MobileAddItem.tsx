
import React, { useState, useMemo } from 'react';
import { Cart, Product, CartItem } from '../../types';
import { ChevronLeftIcon, PlusIcon, MinusIcon, SearchIcon, CartIcon, XMarkIcon } from '../Icons';

interface MobileAddItemProps {
    cart: Cart;
    products: Product[];
    onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
    onBack: () => void;
}

const MobileAddItem: React.FC<MobileAddItemProps> = ({ cart, products, onUpdateItem, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.sku.toLowerCase().includes(lowerSearch));
    }, [products, searchTerm]);

    const getCartQuantity = (sku: string) => {
        return cart.items?.find(item => item.sku === sku)?.quantity || 0;
    };

    const handleAdd = (product: Product) => {
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
                        <h1 className="text-xl font-bold text-gray-900">Add Items</h1>
                        <p className="text-xs text-gray-500 mt-0.5">To: {cart.name}</p>
                    </div>
                    <button onClick={onBack} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 active:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search catalog..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 text-base font-medium shadow-sm"
                        autoFocus
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {filteredProducts.slice(0, 50).map(product => { // Limit results for performance
                    const quantity = getCartQuantity(product.sku);
                    return (
                        <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-gray-100 border border-gray-100" />
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-sm text-gray-900 truncate mb-1">{product.name}</p>
                                <p className="text-xs text-gray-500 truncate mb-2">{product.sku}</p>
                                <p className="font-bold text-blue-600">${product.unitPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {quantity === 0 ? (
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
                                )}
                            </div>
                        </div>
                    );
                })}
                <div className="h-12"></div> {/* Spacer for bottom area */}
            </main>
        </div>
    );
};

export default MobileAddItem;
