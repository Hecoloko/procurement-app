import React from 'react';
import { Cart, CartItem } from '../types';
import { PlusIcon, MinusIcon, ChevronRightIcon, TrashIcon } from './Icons';

interface CatalogCartSidebarProps {
  activeCart: Cart | null;
  onUpdateItem: (product: { sku: string; name: string; unitPrice: number }, newQuantity: number, note?: string) => void;
  onBackToDetail: () => void;
}

const CatalogCartSidebar: React.FC<CatalogCartSidebarProps> = ({ activeCart, onUpdateItem, onBackToDetail }) => {
  if (!activeCart) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No active cart.</p>
      </div>
    );
  }

  const subtotal = activeCart.items.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleUpdate = (item: CartItem, newQuantity: number) => {
    // Reconstruct a product-like object for the handler
    const productInfo = {
      sku: item.sku,
      name: item.name,
      unitPrice: item.unitPrice,
    };
    onUpdateItem(productInfo, newQuantity, item.note);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 h-full flex flex-col" style={{ minHeight: '60vh' }}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 truncate" title={activeCart.name}>{activeCart.name}</h2>
      <p className="text-sm text-gray-500 mb-4">{activeCart.items.reduce((acc, item) => acc + item.quantity, 0)} item(s)</p>

      {activeCart.items.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-center">
          <p className="text-gray-500">Your cart is empty.<br />Add items from the catalog.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-3">
          {activeCart.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-tight">{item.name}</p>
                {item.note && <p className="text-xs text-gray-500 truncate" title={item.note}>Note: {item.note}</p>}
                <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleUpdate(item, item.quantity - 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                  {item.quantity === 1 ? <TrashIcon className="w-4 h-4 text-red-500" /> : <MinusIcon className="w-4 h-4 text-gray-600" />}
                </button>
                <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                <button onClick={() => handleUpdate(item, item.quantity + 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                  <PlusIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-100 mb-4">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onBackToDetail}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 active:scale-95 flex items-center justify-center gap-2"
        >
          View Full Cart <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CatalogCartSidebar;
