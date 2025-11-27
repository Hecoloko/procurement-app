
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
        <div className="animate-slide-in-right h-full flex flex-col">
            <header className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-md -mx-4 px-4 pt-2 pb-4 border-b border-white/5">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-400 hover:text-white mb-3 py-2">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white truncate max-w-[250px]">{cart.name}</h1>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-300 rounded border border-gray-700">{cart.status}</span>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</p>
                         <p className="text-xl font-bold text-white">${subtotal.toFixed(2)}</p>
                    </div>
                </div>
            </header>

            <div className="space-y-4 py-6 pb-32">
                {cart.items.length > 0 ? (
                    cart.items.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="bg-[#1E1E1E] p-4 rounded-2xl border border-white/5 flex justify-between items-start shadow-sm active:scale-[0.99] transition-transform"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex-grow pr-4">
                                <p className="font-bold text-white text-base mb-1">{item.name}</p>
                                {item.note && <p className="text-xs text-gray-400 italic mb-2 bg-black/20 p-1.5 rounded-md inline-block">"{item.note}"</p>}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-black/30 text-gray-300 text-xs font-medium px-2 py-1 rounded-md">{item.quantity} qty</span>
                                    <span className="text-xs text-gray-500">x</span>
                                    <span className="text-xs text-gray-300 font-medium">${item.unitPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <p className="font-bold text-white text-lg">${item.totalPrice.toFixed(2)}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-60">
                        <p className="text-lg font-medium text-white">Cart is empty</p>
                        <p className="text-sm text-gray-500 mt-1">Tap the + button to add items</p>
                    </div>
                )}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1E1E1E]/90 backdrop-blur-xl border-t border-white/10 z-20 pb-safe-bottom">
                 <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-900/20 transition-transform duration-200 active:scale-95 text-lg flex justify-between items-center">
                    <span>Submit for Approval</span>
                    <span>${subtotal.toFixed(2)}</span>
                </button>
            </div>
        </div>
    );
};

export default MobileCartDetail;
