
import React, { useEffect, useState } from 'react';
import { BillableItem } from '../../../types';
import { billbackService } from '../../../services/billbackService';
import { XMarkIcon, RefreshIcon, CheckIcon } from '../../Icons';

interface UnbilledItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    propertyName?: string;
    propertyId?: string;
    customerId?: string; // Optional: filter by customer
    onImport: (items: BillableItem[]) => void;
}

const UnbilledItemsModal: React.FC<UnbilledItemsModalProps> = ({ isOpen, onClose, companyId, propertyName, propertyId, customerId, onImport }) => {
    const [items, setItems] = useState<BillableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen, companyId, propertyId]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            // Note: Service currently filters by propertyId if provided.
            // If we want to filter by customerId, we might need to update service or filter client-side.
            // For now, client-side filter is fine if data set isn't huge.
            let data = await billbackService.getUnbilledBillableItems(companyId, propertyId);

            if (customerId) {
                // If the item has a customerId, it MUST match. 
                // If it's NULL (unassigned), maybe we show it? 
                // Safest: Show items aimed at this customer OR items for the property where customer is null?
                // Let's simplified: Filter where (item.customerId === customerId OR item.customerId is null)
                data = data.filter(i => !i.customerId || i.customerId === customerId);
            }

            setItems(data);
            setSelectedItemIds(new Set());
        } catch (err) {
            console.error(err);
            alert('Failed to load billable items');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (id: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItemIds(newSet);
    };

    const handleImport = () => {
        const selected = items.filter(i => selectedItemIds.has(i.id));
        onImport(selected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Billable Items</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {propertyName ? `For Property: ${propertyName}` : 'Select items to invoice'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-12 flex justify-center text-gray-400">
                                <RefreshIcon className="w-8 h-8 animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                                <p className="font-semibold">No Pending Items Found</p>
                                <p className="text-xs mt-1">Items appear here when vendor invoices are paid.</p>
                            </div>
                        ) : (
                            items.map(item => {
                                const isSelected = selectedItemIds.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`
                                            group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                            ${isSelected
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                                        {item.description}
                                                    </h3>
                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">{item.sourceType}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Cost: ${item.costAmount?.toFixed(2)} + Markup: ${item.markupAmount?.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-gray-900 dark:text-white">
                                                    ${item.totalAmount.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                                                <CheckIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {selectedItemIds.size} items selected
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedItemIds.size === 0}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Import Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnbilledItemsModal;
