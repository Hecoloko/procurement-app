
import React from 'react';
import { Product, ProductVendorOption } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

interface VendorComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    currentVendorId?: string;
    onSelect: (option: ProductVendorOption) => void;
}

const VendorComparisonModal: React.FC<VendorComparisonModalProps> = ({ isOpen, onClose, product, currentVendorId, onSelect }) => {
    if (!isOpen) return null;

    const options = product.vendorOptions || [];
    const sortedOptions = [...options].sort((a, b) => a.price - b.price);
    const bestPrice = sortedOptions.length > 0 ? sortedOptions[0].price : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Compare Vendors</h2>
                        <p className="text-sm text-gray-500 truncate max-w-[250px]">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </header>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {options.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No alternative vendors found for this product.</p>
                    ) : (
                        sortedOptions.map((option) => {
                            const isBestPrice = option.price === bestPrice;
                            const isCurrent = option.vendorId === currentVendorId;

                            return (
                                <div
                                    key={option.id}
                                    className={`relative p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    {isBestPrice && (
                                        <div className="absolute -top-3 left-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            BEST PRICE
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-900">{option.vendorName}</h3>
                                        {isCurrent && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">Current</span>}
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-500">SKU: {option.vendorSku}</p>
                                            {option.isPreferred && <p className="text-[10px] text-purple-600 font-bold mt-1">PREFERRED VENDOR</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${isBestPrice ? 'text-green-600' : 'text-gray-900'}`}>
                                                ${option.price.toFixed(2)}
                                            </p>
                                            {!isCurrent && (
                                                <button
                                                    onClick={() => onSelect(option)}
                                                    className="mt-2 text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 active:scale-95 transition-all"
                                                >
                                                    Select
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorComparisonModal;
