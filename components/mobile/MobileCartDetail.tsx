
import React from 'react';
import { Cart } from '../../types';
import { ChevronLeftIcon } from '../Icons';

interface MobileCartDetailProps {
    cart: Cart;
    onBack: () => void;
}

const MobileCartDetail: React.FC<MobileCartDetailProps> = ({ cart, onBack }) => {
    const subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    return (
        <div className="animate-slide-in-right h-full flex flex-col bg-gray-50">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md -mx-4 px-4 pt-2 pb-4 border-b border-gray-200 shadow-sm">
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-3 py-2">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 truncate max-w-[250px]">{cart.name}</h1>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded border border-gray-200">{cart.status}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total</p>
                        <p className="text-xl font-bold text-gray-900">${subtotal.toFixed(2)}</p>
                    </div>
                </div>
            </header>

            <div className="space-y-4 py-6 pb-32 px-4">
                {cart.items.length > 0 ? (
                    cart.items.map((item, index) => (
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
                            </div>
                            <p className="font-bold text-gray-900 text-lg">${item.totalPrice.toFixed(2)}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-60">
                        <p className="text-lg font-medium text-gray-900">Cart is empty</p>
                        <p className="text-sm text-gray-500 mt-1">Tap the + button to add items</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-20 pb-safe-bottom">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-transform duration-200 active:scale-95 text-lg flex justify-between items-center">
                    <span>Submit for Approval</span>
                    <span>${subtotal.toFixed(2)}</span>
                </button>
            </div>
        </div>
    );
};

export default MobileCartDetail;
