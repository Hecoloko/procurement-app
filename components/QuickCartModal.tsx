
import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from './Icons';
import { CartItem, Property } from '../types';

type QuickCartItem = Omit<CartItem, 'id' | 'totalPrice'>;

interface QuickCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string, items: QuickCartItem[], propertyId: string }) => void;
  properties: Property[];
}

const QuickCartModal: React.FC<QuickCartModalProps> = ({ isOpen, onClose, onSave, properties }) => {
  const [cartName, setCartName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [items, setItems] = useState<QuickCartItem[]>([]);
  
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemNote, setItemNote] = useState('');

  useEffect(() => {
      if (isOpen) {
          setCartName(`Quick Cart - ${new Date().toLocaleDateString()}`);
          setPropertyId(properties[0]?.id || '');
          setItems([]);
          setItemName('');
          setItemQuantity(1);
          setItemPrice(0);
          setItemNote('');
      }
  }, [isOpen, properties]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [items]);

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!itemName.trim() || itemQuantity <= 0 || itemPrice < 0) return;
    const newItem: QuickCartItem = {
        name: itemName.trim(),
        sku: `MANUAL-${Date.now().toString().slice(-6)}`,
        quantity: itemQuantity,
        unitPrice: itemPrice,
        note: itemNote.trim()
    };
    setItems(prev => [...prev, newItem]);
    // Reset form
    setItemName('');
    setItemQuantity(1);
    setItemPrice(0);
    setItemNote('');
    document.getElementById('itemName')?.focus();
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    if (items.length > 0 && cartName.trim() && propertyId) {
        onSave({ name: cartName.trim(), items, propertyId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 text-white" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-tight">Create a Quick Order</h2>
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cartName" className="block text-sm font-medium text-white/90 mb-1">Order Name</label>
                        <input 
                            type="text" 
                            id="cartName" 
                            value={cartName} 
                            onChange={e => setCartName(e.target.value)} 
                            required 
                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                        />
                    </div>
                    <div>
                         <label htmlFor="property" className="block text-sm font-medium text-white/90 mb-1">Property</label>
                        <select 
                            id="property" 
                            value={propertyId} 
                            onChange={(e) => setPropertyId(e.target.value)} 
                            required 
                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="bg-gray-900 text-gray-400">Select a property</option>
                            {properties.map(prop => (
                            <option key={prop.id} value={prop.id} className="bg-gray-900 text-white">{prop.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Add Item Form */}
                <form onSubmit={handleAddItem} className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Add Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="itemName" className="block text-xs font-medium text-white/70 mb-1">Name</label>
                            <input type="text" id="itemName" value={itemName} onChange={e => setItemName(e.target.value)} className="block w-full text-sm px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-1 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="itemQuantity" className="block text-xs font-medium text-white/70 mb-1">Qty</label>
                            <input type="number" id="itemQuantity" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} min="1" className="block w-full text-sm px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-1 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="itemPrice" className="block text-xs font-medium text-white/70 mb-1">Unit Price</label>
                            <input type="number" id="itemPrice" value={itemPrice} onChange={e => setItemPrice(Number(e.target.value))} min="0" step="0.01" className="block w-full text-sm px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-1 focus:ring-green-500 outline-none" />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white rounded-lg h-[38px] flex items-center justify-center hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                     <div className="mt-3">
                        <label htmlFor="itemNote" className="block text-xs font-medium text-white/70 mb-1">Note (Optional)</label>
                        <input type="text" id="itemNote" value={itemNote} onChange={e => setItemNote(e.target.value)} className="block w-full text-sm px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-1 focus:ring-green-500 outline-none" />
                    </div>
                </form>

                {/* Items List */}
                <div>
                    <h3 className="font-bold text-white mb-3">Items in Order</h3>
                    {items.length > 0 ? (
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                            <table className="w-full text-sm text-white">
                                <thead className="bg-white/10 text-xs uppercase text-white/70">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 font-semibold">Name</th>
                                        <th className="px-4 py-3 text-center font-semibold">Qty</th>
                                        <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                                        <th className="px-4 py-3 text-right font-semibold">Total</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                {item.name}
                                                {item.note && <div className="text-xs text-white/50 italic mt-0.5">Note: {item.note}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-center text-white/80">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-white/80">${item.unitPrice.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-400">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-white/40 hover:text-red-400 transition-colors p-1">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center py-8 text-white/40 text-sm bg-white/5 rounded-xl border border-white/10 border-dashed">No items added yet.</p>
                    )}
                </div>

                {/* Summary */}
                <div className="text-right">
                    <span className="text-white/70 mr-4">Total Amount:</span>
                    <span className="font-bold text-2xl text-white tracking-tight">${subtotal.toFixed(2)}</span>
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={items.length === 0 || !propertyId} 
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Submit Order
                </button>
            </div>
        </div>
    </div>
  );
};

export default QuickCartModal;
