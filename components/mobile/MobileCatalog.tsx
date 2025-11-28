
import React, { useState, useMemo } from 'react';
import { Product, Cart } from '../../types';
import { PlusIcon, MinusIcon, SearchIcon } from '../Icons';

interface MobileCatalogProps {
    products: Product[];
    carts: Cart[];
    activeCart: Cart | null;
    onSelectCart: (cart: Cart) => void;
    onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number) => void;
}

const MobileCatalog: React.FC<MobileCatalogProps> = ({ products, carts, activeCart, onSelectCart, onUpdateItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const openCarts = useMemo(() => carts.filter(c => c.status === 'Draft' || c.status === 'Ready for Review'), [carts]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.sku.toLowerCase().includes(lowerSearch));
    }, [products, searchTerm]);

    const getCartQuantity = (sku: string) => {
        return activeCart?.items.find(item => item.sku === sku)?.quantity || 0;
    };

    const handleCartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cartId = e.target.value;
        const newActiveCart = carts?.find(c => c.id === cartId);
        if (newActiveCart) {
            onSelectCart(newActiveCart);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Product Catalog</h1>

            <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10 -mx-4 px-4 mb-4 border-b dark:border-gray-700">
                <div className="relative mb-3">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div>
                    <label htmlFor="cart-selector-catalog" className="text-xs font-medium text-gray-600 dark:text-gray-400">Adding to cart:</label>
                    <select
                        id="cart-selector-catalog"
                        value={activeCart?.id || ''}
                        onChange={handleCartChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        {openCarts.length === 0 ? (
                            <option value="" disabled>No Open Carts</option>
                        ) : (
                            openCarts.map(cart => (
                                <option key={cart.id} value={cart.id}>{cart.name}</option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {!activeCart && (
                <div className="text-center py-10 text-gray-500">Please select a cart to start adding items.</div>
            )}

            {activeCart && <div className="space-y-3 pb-20">
                {filteredProducts.slice(0, 50).map(product => {
                    const quantity = getCartQuantity(product.sku);
                    return (
                        <div key={product.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 flex items-center gap-3">
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{product.name}</p>
                                <p className="font-bold text-gray-900 dark:text-gray-200">${product.unitPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {quantity === 0 ? (
                                    <button
                                        onClick={() => onUpdateItem(product, 1)}
                                        className="bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-full text-sm"
                                    >
                                        Add
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                                        <button onClick={() => onUpdateItem(product, quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="w-5 h-5" /></button>
                                        <span className="text-lg w-6 text-center">{quantity}</span>
                                        <button onClick={() => onUpdateItem(product, quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="w-5 h-5" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>}
        </div>
    );
};

export default MobileCatalog;
