
import React from 'react';
import { Cart, Product, ProductVendorOption } from '../../types';
import { ChevronLeftIcon } from '../Icons';
import VendorComparisonModal from '../VendorComparisonModal';
import { useState } from 'react';

interface MobileCartDetailProps {
    cart: Cart;
    onBack: () => void;
    onAddItems: () => void;
    products: Product[];
    onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
}

const MobileCartDetail: React.FC<MobileCartDetailProps> = ({ cart, onBack, onAddItems, products, onUpdateItem }) => {
    const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const [comparisonProduct, setComparisonProduct] = useState<Product | null>(null);
    const [currentComparisonVendorId, setCurrentComparisonVendorId] = useState<string | undefined>(undefined);

    const handleCompare = (item: any) => {
        // Find product by SKU or Name to get vendor options
        const product = products.find(p => p.sku === item.sku || p.name === item.name);
        if (product && product.vendorOptions && product.vendorOptions.length > 0) {
            setComparisonProduct(product);
            setCurrentComparisonVendorId(item.vendorId || product.vendorId);
        }
    };


    return (
        <div className="animate-slide-in-right h-full flex flex-col bg-gray-50">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md -mx-4 px-4 pt-2 pb-4 border-b border-gray-200 shadow-sm">
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-3 py-2">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back
                </button>
                <div className="flex justify-between items-end gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 truncate">{cart.name}</h1>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded border border-gray-200">{cart.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total</p>
                            <p className="text-xl font-bold text-gray-900">${subtotal.toFixed(2)}</p>
                        </div>
                        <button
                            onClick={onAddItems}
                            className="bg-blue-600 text-white p-2 rounded-full shadow-md active:scale-90 transition-transform"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="space-y-4 py-6 pb-32 px-4">
                {cart.items.length > 0 ? (
                    cart.items.map((item, index) => {
                        const product = products.find(p => p.sku === item.sku || p.name === item.name);
                        const hasAlternatives = product?.vendorOptions && product.vendorOptions.length > 0;

                        return (
                            <div
                                key={item.id}
                                className="bg-white p-4 rounded-2xl border border-gray-200 flex justify-between items-start shadow-sm active:scale-[0.99] transition-transform"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex-grow pr-4">
                                    <p className="font-bold text-gray-900 text-base mb-1">{item.name}</p>
                                    {item.note && <p className="text-xs text-gray-500 italic mb-2 bg-gray-50 p-1.5 rounded-md inline-block">"{item.note}"</p>}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md">{item.quantity} qty</span>
                                        <span className="text-xs text-gray-400">x</span>
                                        <span className="text-xs text-gray-700 font-medium">${item.unitPrice.toFixed(2)}</span>
                                    </div>
                                    {hasAlternatives && (
                                        <button
                                            onClick={() => {
                                                setComparisonProduct(product!);
                                                setCurrentComparisonVendorId(item.vendorId);
                                            }}
                                            className="mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06.04z" clipRule="evenodd" />
                                            </svg>
                                            Compare Vendors
                                        </button>
                                    )}
                                </div>
                                <p className="font-bold text-gray-900 text-lg">${item.totalPrice.toFixed(2)}</p>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-80">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🛒</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">Cart is empty</p>
                        <p className="text-sm text-gray-500 mt-1 mb-6 text-center max-w-[200px]">Start adding items to your cart to proceed.</p>
                        <button
                            onClick={onAddItems}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                        >
                            Add Items
                        </button>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-20 pb-safe-bottom">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-transform duration-200 active:scale-95 text-lg flex justify-between items-center">
                    <span>Submit for Approval</span>
                    <span>${subtotal.toFixed(2)}</span>
                </button>
            </div>

            {comparisonProduct && (
                <VendorComparisonModal
                    isOpen={!!comparisonProduct}
                    onClose={() => setComparisonProduct(null)}
                    product={comparisonProduct}
                    currentVendorId={currentComparisonVendorId}
                    onSelect={(option) => {
                        const cartItem = cart.items.find(i => i.sku === comparisonProduct.sku || i.name === comparisonProduct.name);
                        if (cartItem) {
                            onUpdateItem({
                                sku: comparisonProduct.sku,
                                name: comparisonProduct.name,
                                unitPrice: option.price,
                                // @ts-ignore
                                vendorId: option.vendorId
                            }, cartItem.quantity, cartItem.note);
                        }
                        setComparisonProduct(null);
                    }}
                />
            )}
        </div>
    );
};

export default MobileCartDetail;
