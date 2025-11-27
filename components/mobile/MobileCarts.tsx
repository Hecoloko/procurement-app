

import React, { useState } from 'react';
import { Cart, Product } from '../../types';
import MobileCartDetail from './MobileCartDetail';
import MobileAddItem from './MobileAddItem';
import { ChevronRightIcon } from '../Icons';
import ManualAddItemModal from '../ManualAddItemModal';

interface MobileCartsProps {
    carts: Cart[];
    products: Product[];
    onUpdateCartItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
    activeCart: Cart | null;
    onSelectCart: (cart: Cart | null) => void;
    view: 'list' | 'add_item' | 'manual_add';
    setView: (view: 'list' | 'add_item' | 'manual_add') => void;
}

const MobileCarts: React.FC<MobileCartsProps> = ({ carts, products, onUpdateCartItem, activeCart, onSelectCart, view, setView }) => {
    
    const openCarts = carts.filter(c => c.status === 'Draft' || c.status === 'Ready for Review');

    const handleSaveManualItem = (itemData: { name: string; sku: string; quantity: number; unitPrice: number; note?: string; }) => {
        if (!activeCart) return;
        const productInfo = {
            name: itemData.name,
            sku: itemData.sku || `MANUAL-${Date.now()}`,
            unitPrice: itemData.unitPrice
        };
        onUpdateCartItem(productInfo, itemData.quantity, itemData.note);
        setView('list'); // Return to detail view after adding
    };

    if (view === 'add_item' && activeCart) {
        return <MobileAddItem cart={activeCart} products={products} onUpdateItem={onUpdateCartItem} onBack={() => setView('list')} />
    }
    
    if (view === 'manual_add' && activeCart) {
        return (
            <>
                <MobileCartDetail 
                    cart={activeCart} 
                    onBack={() => { onSelectCart(null); setView('list'); }} 
                />
                <ManualAddItemModal
                    isOpen={true}
                    onClose={() => setView('list')}
                    onSave={handleSaveManualItem}
                    products={products}
                />
            </>
        );
    }
    
    if (activeCart && view === 'list') {
        return (
            <MobileCartDetail 
                cart={activeCart} 
                onBack={() => { onSelectCart(null); setView('list'); }} 
            />
        )
    }

    // List View
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">My Carts</h1>
            <div className="space-y-3">
                {openCarts.map(cart => (
                    <button key={cart.id} onClick={() => onSelectCart(cart)} className="w-full text-left bg-[#1E1E1E] p-4 rounded-xl shadow-lg border border-gray-800 flex justify-between items-center transition-transform active:scale-95">
                        <div>
                            <h2 className="font-bold text-white">{cart.name}</h2>
                            <p className="text-sm text-gray-400 mt-1">{cart.itemCount} items &bull; ${cart.totalCost.toFixed(2)}</p>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    </button>
                ))}
            </div>
            {openCarts.length === 0 && (
                <p className="text-center text-gray-400 py-16">No open carts available.</p>
            )}
        </div>
    );
};

export default MobileCarts;