import React, { useState, useEffect } from 'react';
import { Product, Company } from '../types';
import { supabase } from '../supabaseClient';
import { PlusIcon, SearchIcon, FilterIcon } from './Icons';
import AdoptProductModal from './AdoptProductModal';

interface GlobalCatalogProps {
    companyId: string;
    onProductAdopted: () => void;
}

const GlobalCatalog: React.FC<GlobalCatalogProps> = ({ companyId, onProductAdopted }) => {
    const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isAdoptModalOpen, setIsAdoptModalOpen] = useState(false);

    useEffect(() => {
        fetchGlobalProducts();
    }, [companyId]);

    const fetchGlobalProducts = async () => {
        setLoading(true);
        // Fetch all products NOT from this company
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .neq('company_id', companyId)
            .order('name');

        if (error) {
            console.error('Error fetching global products:', error);
        } else {
            // Map DB fields to Product type
            const mappedData: Product[] = (data || []).map((item: any) => ({
                id: item.id,
                companyId: item.company_id,
                name: item.name,
                sku: item.sku,
                description: item.description,
                unitPrice: item.unit_price,
                imageUrl: item.image_url,
                vendorId: item.vendor_id,
                primaryCategory: item.primary_category,
                secondaryCategory: item.secondary_category,
                rating: item.rating,
                tags: item.tags,
                globalProductId: item.global_product_id
            }));
            setGlobalProducts(mappedData);
        }
        setLoading(false);
    };

    const handleAdoptClick = (product: Product) => {
        setSelectedProduct(product);
        setIsAdoptModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAdoptModalOpen(false);
        setSelectedProduct(null);
    };

    const handleSuccess = () => {
        handleCloseModal();
        onProductAdopted();
    };

    const filteredProducts = globalProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primaryCategory.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Networked Catalog</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Browse and adopt products from other companies in the network.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search network catalog..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                        <FilterIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
                            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 relative">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                                    {product.primaryCategory}
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-2">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                        Sold by: {product.companyId}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2" title={product.name}>
                                    {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                                    {product.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Price</span>
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                                            ${product.unitPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        id={`adopt-btn-${product.id}`}
                                        onClick={() => handleAdoptClick(product)}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Adopt
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No products found in the network.</p>
                </div>
            )}

            {isAdoptModalOpen && selectedProduct && (
                <AdoptProductModal
                    isOpen={isAdoptModalOpen}
                    onClose={handleCloseModal}
                    sourceProduct={selectedProduct}
                    companyId={companyId}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default GlobalCatalog;
