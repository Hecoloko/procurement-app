
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
        <div className="fixed inset-0 z-50 flex flex-col font-sans animate-slide-up bg-[#121212]">
            {/* Drag Handle Area */}
            <div className="w-full flex justify-center pt-3 pb-1 bg-[#1E1E1E] rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)] border-t border-white/10" onClick={onBack}>
                <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
            </div>

            <header className="bg-[#1E1E1E] px-4 pb-4 border-b border-white/5 shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white">Add Items</h1>
                        <p className="text-xs text-gray-400 mt-0.5">To: {cart.name}</p>
                    </div>
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white active:bg-gray-700 transition-colors">
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
                        className="w-full pl-10 pr-4 py-3 border border-transparent rounded-xl focus:ring-2 focus:ring-green-500 bg-[#2C2C2E] text-white placeholder-gray-500 text-base font-medium shadow-inner"
                        autoFocus
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#121212]">
                {filteredProducts.slice(0, 50).map(product => { // Limit results for performance
                    const quantity = getCartQuantity(product.sku);
                    return (
                        <div key={product.id} className="bg-[#1E1E1E] p-3 rounded-2xl border border-white/5 flex items-center gap-4 shadow-sm">
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-gray-800" />
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-sm text-white truncate mb-1">{product.name}</p>
                                <p className="text-xs text-gray-400 truncate mb-2">{product.sku}</p>
                                <p className="font-bold text-green-400">${product.unitPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {quantity === 0 ? (
                                    <button
                                        onClick={() => handleAdd(product)}
                                        className="bg-green-600 text-white font-bold px-5 py-2 rounded-full text-xs shadow-lg shadow-green-900/30 active:scale-90 transition-transform"
                                    >
                                        ADD
                                    </button>
                                ) : (
                                    <div className="flex items-center bg-gray-800 rounded-full p-1 border border-gray-700">
                                        <button onClick={() => handleDecrement(product, quantity)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors active:scale-90"><MinusIcon className="w-4 h-4" /></button>
                                        <span className="text-sm font-bold text-white w-8 text-center">{quantity}</span>
                                        <button onClick={() => handleIncrement(product, quantity)} className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-500 text-white transition-colors active:scale-90 shadow-md"><PlusIcon className="w-4 h-4" /></button>
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
