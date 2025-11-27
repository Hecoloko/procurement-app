
import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from './Icons';
import { Product } from '../types';

interface ManualAddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: { name: string; sku: string; quantity: number; unitPrice: number; note?: string; }) => void;
  products: Product[];
}

const ManualAddItemModal: React.FC<ManualAddItemModalProps> = ({ isOpen, onClose, onSave, products }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  
  const [activeInput, setActiveInput] = useState<'name' | 'sku' | null>(null);
  
  const suggestions = useMemo(() => {
    if (!activeInput) return [];
    
    const searchTerm = (activeInput === 'name' ? name : sku).toLowerCase();
    
    if (searchTerm.length < 2) return [];

    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm)
    ).slice(0, 5);
  }, [name, sku, activeInput, products]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
        setName('');
        setSku('');
        setQuantity(1);
        setUnitPrice(0);
        setNote('');
        setError('');
        setActiveInput(null);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const handleSuggestionClick = (product: Product) => {
    setName(product.name);
    setSku(product.sku);
    setUnitPrice(product.unitPrice);
    setActiveInput(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || quantity <= 0 || unitPrice < 0) {
      setError('Please fill in all required fields with valid values.');
      return;
    }
    onSave({ name: name.trim(), sku: sku.trim(), quantity, unitPrice, note: note.trim() });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-add-item-title"
    >
      <div 
        className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-md transform transition-transform duration-300 scale-95 border border-white/20 text-white"
        onClick={(e) => e.stopPropagation()}
        style={isOpen ? { transform: 'scale(1)', opacity: 1 } : { transform: 'scale(0.95)', opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 id="manual-add-item-title" className="text-xl font-bold text-white tracking-tight">Add Item Manually</h2>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="Close modal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-md" role="alert">{error}</div>}
            
            <div className="relative">
              <label htmlFor="itemName" className="block text-sm font-medium text-white/90 mb-1">Item Name *</label>
              <input 
                type="text" 
                id="itemName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onFocus={() => setActiveInput('name')}
                onBlur={() => setTimeout(() => setActiveInput(null), 200)} // Delay to allow click on suggestion
                required 
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                autoComplete="off"
              />
              {activeInput === 'name' && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-[#1E1E1E] border border-white/20 rounded-lg shadow-2xl mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map(p => (
                    <li key={p.id} onMouseDown={() => handleSuggestionClick(p)} className="px-4 py-3 cursor-pointer hover:bg-white/10 border-b border-white/5 last:border-0">
                      <p className="font-semibold text-sm text-white">{p.name}</p>
                      <p className="text-xs text-white/50">{p.sku}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <label htmlFor="itemSku" className="block text-sm font-medium text-white/90 mb-1">SKU (Optional)</label>
              <input 
                type="text" 
                id="itemSku" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)}
                onFocus={() => setActiveInput('sku')}
                onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                autoComplete="off"
              />
              {activeInput === 'sku' && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-[#1E1E1E] border border-white/20 rounded-lg shadow-2xl mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map(p => (
                    <li key={p.id} onMouseDown={() => handleSuggestionClick(p)} className="px-4 py-3 cursor-pointer hover:bg-white/10 border-b border-white/5 last:border-0">
                      <p className="font-semibold text-sm text-white">{p.name}</p>
                      <p className="text-xs text-white/50">{p.sku}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
                <label htmlFor="itemNote" className="block text-sm font-medium text-white/90 mb-1">Note (Optional)</label>
                <textarea 
                    id="itemNote" 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                    rows={2}
                    className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all resize-none"
                    placeholder="e.g., Special instructions..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="itemQuantity" className="block text-sm font-medium text-white/90 mb-1">Quantity *</label>
                <input 
                    type="number" 
                    id="itemQuantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    min="1" 
                    required 
                    className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="itemUnitPrice" className="block text-sm font-medium text-white/90 mb-1">Unit Price *</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-white/50 sm:text-sm">$</span>
                    </div>
                    <input 
                        type="number" 
                        id="itemUnitPrice" 
                        value={unitPrice} 
                        onChange={(e) => setUnitPrice(Number(e.target.value))} 
                        min="0" 
                        step="0.01" 
                        required 
                        className="block w-full pl-7 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                    />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-sm"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent"
            >
                Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAddItemModal;
