import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '../supabaseClient';
import { XMarkIcon, CheckIcon } from './Icons';

interface AdoptProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceProduct: Product;
    companyId: string;
    onSuccess: () => void;
}

const AdoptProductModal: React.FC<AdoptProductModalProps> = ({ isOpen, onClose, sourceProduct, companyId, onSuccess }) => {
    const [formData, setFormData] = useState<Partial<Product>>({
        name: sourceProduct.name,
        sku: sourceProduct.sku, // Default to source SKU, user can change
        description: sourceProduct.description,
        unitPrice: sourceProduct.unitPrice,
        primaryCategory: sourceProduct.primaryCategory,
        secondaryCategory: sourceProduct.secondaryCategory || 'General',
        imageUrl: sourceProduct.imageUrl,
        globalProductId: sourceProduct.id // Link to the source product ID
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newProduct = {
                id: `prod-${Date.now()}`,
                company_id: companyId,
                name: formData.name,
                sku: formData.sku,
                description: formData.description,
                unit_price: formData.unitPrice,
                image_url: formData.imageUrl,
                primary_category: formData.primaryCategory,
                secondary_category: formData.secondaryCategory,
                global_product_id: sourceProduct.globalProductId || null, // Only link if source is already global
                rating: 5, // Default rating
                tags: ['adopted', `from:${sourceProduct.companyId}`, `origin_id:${sourceProduct.id}`]
            };

            const { error: insertError } = await supabase
                .from('products')
                .insert(newProduct);

            if (insertError) throw insertError;

            onSuccess();
        } catch (err: any) {
            console.error('Error adopting product:', err);
            setError(err.message || 'Failed to adopt product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Adopt Product</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-6">
                        <div className="w-1/3">
                            <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden mb-2">
                                <img
                                    src={formData.imageUrl}
                                    alt="Product Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-500">
                                Image from {sourceProduct.companyId}
                            </p>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Internal SKU
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Unit Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.unitPrice}
                                        onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.primaryCategory}
                                    onChange={e => setFormData({ ...formData, primaryCategory: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            id="confirm-adopt-btn"
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckIcon className="w-4 h-4" />
                            )}
                            Add to Catalog
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdoptProductModal;
