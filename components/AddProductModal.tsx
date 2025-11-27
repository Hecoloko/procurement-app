
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { XMarkIcon } from './Icons';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'vendorId' | 'imageUrl'>) => void;
  allProducts: Product[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave, allProducts }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [secondaryCategory, setSecondaryCategory] = useState('');
  const [error, setError] = useState('');

  const categorySuggestions = useMemo(() => {
    const primary = new Set<string>();
    const secondary = new Set<string>();
    allProducts.forEach(p => {
      primary.add(p.primaryCategory);
      secondary.add(p.secondaryCategory);
    });
    return { primary: Array.from(primary), secondary: Array.from(secondary) };
  }, [allProducts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !primaryCategory.trim() || !secondaryCategory.trim() || unitPrice <= 0) {
      setError('Please fill in all required fields with valid values.');
      return;
    }
    onSave({ name, sku, description, unitPrice, primaryCategory, secondaryCategory });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 text-white" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Add New Product</h2>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="Close modal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-md" role="alert">{error}</div>}
            
            <div>
              <label htmlFor="prodName" className="block text-sm font-medium text-white/90 mb-1">Product Name *</label>
              <input 
                type="text" 
                id="prodName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="prodSku" className="block text-sm font-medium text-white/90 mb-1">SKU</label>
              <input 
                type="text" 
                id="prodSku" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
              />
            </div>

             <div>
              <label htmlFor="prodDesc" className="block text-sm font-medium text-white/90 mb-1">Description</label>
              <textarea 
                id="prodDesc" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3} 
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prodPrice" className="block text-sm font-medium text-white/90 mb-1">Unit Price *</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-white/50">$</span></div>
                    <input 
                        type="number" 
                        id="prodPrice" 
                        value={unitPrice} 
                        onChange={(e) => setUnitPrice(Number(e.target.value))} 
                        min="0.01" 
                        step="0.01" 
                        required 
                        className="block w-full pl-7 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                    />
                </div>
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="prodPrimaryCat" className="block text-sm font-medium text-white/90 mb-1">Primary Category *</label>
                    <input 
                        type="text" 
                        id="prodPrimaryCat" 
                        value={primaryCategory} 
                        onChange={(e) => setPrimaryCategory(e.target.value)} 
                        required 
                        list="primary-cat-suggestions" 
                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                    />
                    <datalist id="primary-cat-suggestions">
                        {categorySuggestions.primary.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                </div>
                 <div>
                    <label htmlFor="prodSecondaryCat" className="block text-sm font-medium text-white/90 mb-1">Secondary Category *</label>
                    <input 
                        type="text" 
                        id="prodSecondaryCat" 
                        value={secondaryCategory} 
                        onChange={(e) => setSecondaryCategory(e.target.value)} 
                        required 
                        list="secondary-cat-suggestions" 
                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                    />
                     <datalist id="secondary-cat-suggestions">
                        {categorySuggestions.secondary.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
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
                Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
