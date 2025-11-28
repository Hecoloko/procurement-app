

import React from 'react';
import { Cart, CartItem } from '../types';
import { XMarkIcon, PlusIcon, MinusIcon, TrashIcon, ChevronRightIcon } from './Icons';

interface GlobalCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCart: Cart | null;
  onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
  onSubmitForApproval: (cartId: string) => void;
  onViewFullCart: () => void;
  onSelectCart: (cart: Cart) => void;
  carts: Cart[];
}

const GlobalCartDrawer: React.FC<GlobalCartDrawerProps> = ({ isOpen, onClose, activeCart, onUpdateItem, onSubmitForApproval, onViewFullCart, onSelectCart, carts }) => {
  const subtotal = activeCart?.items.reduce((acc, item) => acc + item.totalPrice, 0) ?? 0;
  const isSubmittable = activeCart && (activeCart.status === 'Draft' || activeCart.status === 'Ready for Review') && activeCart.items.length > 0;

  const handleUpdate = (item: CartItem, newQuantity: number) => {
    const productInfo = {
      sku: item.sku,
      name: item.name,
      unitPrice: item.unitPrice,
    };
    onUpdateItem(productInfo, newQuantity, item.note);
  };

  const handleCartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cartId = e.target.value;
    const newActiveCart = carts.find(c => c.id === cartId);
    if (newActiveCart) {
      onSelectCart(newActiveCart);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Active Cart</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b dark:border-gray-700">
          <label htmlFor="cart-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a Cart:</label>
          <select
            id="cart-selector"
            value={activeCart?.id || ''}
            onChange={handleCartChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {carts.length === 0 ? (
              <option value="" disabled>No Draft Carts Available</option>
            ) : (
              carts.map(cart => (
                <option key={cart.id} value={cart.id}>{cart.name}</option>
              ))
            )}
          </select>
        </div>

        {activeCart ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeCart.items.length === 0 ? (
                <p className="text-center text-gray-500 pt-10">This cart is empty.</p>
              ) : (
                activeCart.items.map(item => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{item.name}</p>
                      {item.note && <p className="text-xs text-gray-500 italic mt-0.5" title={item.note}>Note: {item.note}</p>}
                      <p className="text-sm text-gray-600 mt-1">${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => handleUpdate(item, item.quantity - 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        {item.quantity === 1 ? <TrashIcon className="w-5 h-5 text-red-500" /> : <MinusIcon className="w-5 h-5 text-gray-600" />}
                      </button>
                      <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleUpdate(item, item.quantity + 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <PlusIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 space-y-3">
              <div className="flex justify-between font-semibold text-lg text-gray-800 dark:text-gray-100">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={onViewFullCart}
                className="w-full bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                View Full Cart <ChevronRightIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onSubmitForApproval(activeCart.id)}
                disabled={!isSubmittable}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit for Approval
              </button>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center p-4">
            <p className="text-gray-500">Please select a cart to view its items or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalCartDrawer;