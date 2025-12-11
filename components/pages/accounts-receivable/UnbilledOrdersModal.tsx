import React, { useEffect, useState } from 'react';
import { Order, Property } from '../../../types';
import { billbackService } from '../../../services/billbackService';
import { XMarkIcon, RefreshIcon, CheckIcon } from '../../Icons';

interface UnbilledOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    propertyName?: string; // Optional name for display
    propertyId?: string;   // To filter by property if we have it linked
    onImport: (orders: Order[], markupPercentage: number) => void;
}

const UnbilledOrdersModal: React.FC<UnbilledOrdersModalProps> = ({ isOpen, onClose, companyId, propertyName, propertyId, onImport }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [markup, setMarkup] = useState<number>(20); // Default 20%

    useEffect(() => {
        if (isOpen) {
            fetchOrders();
        }
    }, [isOpen, companyId, propertyId]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await billbackService.getUnbilledOrders(companyId, propertyId);
            setOrders(data);
            setSelectedOrderIds(new Set()); // Reset selection on re-fetch
        } catch (err) {
            console.error(err);
            alert('Failed to load unbilled orders');
        } finally {
            setLoading(false);
        }
    };

    const toggleOrder = (orderId: string) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(orderId)) {
            newSet.delete(orderId);
        } else {
            newSet.add(orderId);
        }
        setSelectedOrderIds(newSet);
    };

    const handleImport = () => {
        const selected = orders.filter(o => selectedOrderIds.has(o.id));
        onImport(selected, markup);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Billable Work</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {propertyName ? `For Property: ${propertyName}` : 'Select unbilled orders to invoice'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Markup Setting */}
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                Apply Markup (%)
                            </label>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Costs will be increased by this percentage for the invoice.
                            </p>
                        </div>
                        <div className="relative w-32">
                            <input
                                type="number"
                                min="0"
                                value={markup}
                                onChange={e => setMarkup(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-8 py-2 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-right font-bold text-lg focus:border-blue-500 focus:ring-0 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-12 flex justify-center text-gray-400">
                                <RefreshIcon className="w-8 h-8 animate-spin" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                                <p className="font-semibold">No Unbilled Orders Found</p>
                                <p className="text-xs mt-1">Check that orders are marked 'Completed' or 'Received'.</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const isSelected = selectedOrderIds.has(order.id);
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => toggleOrder(order.id)}
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
                                                        {order.cartName}
                                                    </h3>
                                                    {order.workOrderId && <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">{order.workOrderId}</span>}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {order.submissionDate} • {order.items?.length || 0} items
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-gray-900 dark:text-white">
                                                    ${(order.totalCost || 0).toFixed(2)}
                                                </div>
                                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                    + ${(order.totalCost * (markup / 100)).toFixed(2)} Markup
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
                        {selectedOrderIds.size} orders selected
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedOrderIds.size === 0}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Import & Apply Markup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnbilledOrdersModal;
