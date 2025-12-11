import React, { useState, useEffect, useMemo } from 'react';
import { BillableItem, Customer, Property, Unit } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { RefreshIcon, SearchIcon, PlusIcon, CheckCircleIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, BuildingOfficeIcon } from '../../Icons';
import { billbackService } from '../../../services/billbackService';

interface BillableItemsListProps {
    companyId: string;
    customers: Customer[];
    properties: Property[];
    units: Unit[];
    onCreateInvoice: (selectedItems: BillableItem[]) => void;
}

const BillableItemsList: React.FC<BillableItemsListProps> = ({ companyId, customers, properties, units, onCreateInvoice }) => {
    const [items, setItems] = useState<BillableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('billable_items')
                .select('*')
                .eq('company_id', companyId)
                .eq('status', 'Pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map data to BillableItem type
            const mappedItems: BillableItem[] = (data || []).map((item: any) => ({
                id: item.id,
                companyId: item.company_id,
                sourceType: item.source_type,
                sourceId: item.source_id,
                propertyId: item.property_id,
                unitId: item.unit_id,
                customerId: item.customer_id,
                description: item.description,
                costAmount: item.cost_amount,
                markupAmount: item.markup_amount,
                totalAmount: item.total_amount,
                status: item.status,
                invoiceId: item.invoice_id,
                createdAt: item.created_at
            }));

            setItems(mappedItems);
        } catch (err) {
            console.error('Error fetching billable items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (companyId) {
                // Auto-sync checks for any missing items from paid POs
                try {
                    await billbackService.syncMissingBillableItems(companyId);
                } catch (e) {
                    console.error("Auto-sync failed:", e);
                }
                await fetchItems();
            }
        };
        init();
    }, [companyId]);

    const getCustomerName = (item: BillableItem) => {
        // Priority: Property Name - Unit Name > Customer Name
        if (item.propertyId) {
            const prop = properties.find(p => p.id === item.propertyId);
            const unit = units.find(u => u.id === item.unitId);
            if (prop) {
                return unit ? `${prop.name} - ${unit.name}` : prop.name;
            }
        }

        // Fallback to customer ID if present
        if (item.customerId) {
            return customers.find(c => c.id === item.customerId)?.name || 'Unknown Customer';
        }

        return 'Unknown Customer';
    };

    const getUnitName = (item: BillableItem) => {
        if (item.unitId) {
            return units.find(u => u.id === item.unitId)?.name || 'Unknown Unit';
        }
        return null;
    };

    // Grouping Logic
    const groupedItems = useMemo(() => {
        const groups: Record<string, BillableItem[]> = {};

        items.forEach(item => {
            const groupName = getCustomerName(item);
            // Filter by search term
            if (searchTerm && !groupName.toLowerCase().includes(searchTerm.toLowerCase()) && !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return;
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(item);
        });

        return groups;
    }, [items, searchTerm, properties, units, customers]);

    const sortedGroupKeys = Object.keys(groupedItems).sort();

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all visible items
            const allIds = new Set<string>();
            Object.values(groupedItems).flat().forEach(i => allIds.add(i.id));
            setSelectedItemIds(allIds);
        } else {
            setSelectedItemIds(new Set());
        }
    };

    const handleSelectGroup = (groupName: string, isChecked: boolean) => {
        const groupItems = groupedItems[groupName];
        const newSet = new Set(selectedItemIds);
        groupItems.forEach(item => {
            if (isChecked) newSet.add(item.id);
            else newSet.delete(item.id);
        });
        setSelectedItemIds(newSet);
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItemIds(newSet);
    };

    const toggleGroup = (groupName: string) => {
        const newSet = new Set(collapsedGroups);
        if (newSet.has(groupName)) {
            newSet.delete(groupName);
        } else {
            newSet.add(groupName);
        }
        setCollapsedGroups(newSet);
    };

    const handleCreateInvoiceClick = () => {
        const selected = items.filter(i => selectedItemIds.has(i.id));
        if (selected.length === 0) return;
        onCreateInvoice(selected);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Pending Billable Items</h2>
                    <p className="text-sm text-muted-foreground mt-1">Review and invoice expenses to tenants.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const count = await billbackService.syncMissingBillableItems(companyId);
                                if (count > 0) alert(`Synced ${count} missing items!`);
                                await fetchItems();
                            } catch (e) {
                                console.error(e);
                                alert('Sync failed. Check console.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-border text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition items-center gap-2 shadow-sm"
                    >
                        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync
                    </button>
                    {selectedItemIds.size > 0 && (
                        <button
                            onClick={handleCreateInvoiceClick}
                            className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all animate-in zoom-in duration-200"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Invoice ({selectedItemIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white dark:bg-slate-900 dark:border-slate-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                    placeholder="Search by customer, unit, or item description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading && items.length === 0 ? (
                <div className="text-center py-12">
                    <RefreshIcon className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading billable items...</p>
                </div>
            ) : sortedGroupKeys.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                    <BuildingOfficeIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Pending Items</h3>
                    <p className="text-gray-500 mt-1">Great job! All billable expenses have been processed.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Global Select All */}
                    <div className="flex items-center gap-3 px-2">
                        <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={items.length > 0 && selectedItemIds.size === items.length}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select All Items</span>
                    </div>

                    {sortedGroupKeys.map(groupName => {
                        const groupItems = groupedItems[groupName];
                        const groupTotal = groupItems.reduce((sum, i) => sum + i.totalAmount, 0);
                        const allGroupSelected = groupItems.every(i => selectedItemIds.has(i.id));
                        const isCollapsed = collapsedGroups.has(groupName);

                        return (
                            <div key={groupName} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                {/* Group Header */}
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between cursor-pointer select-none" onClick={() => toggleGroup(groupName)}>
                                    <div className="flex items-center gap-4">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={allGroupSelected}
                                                onChange={(e) => handleSelectGroup(groupName, e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{groupName}</h3>
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                                    {groupItems.length}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">Total Unbilled: <span className="font-semibold text-gray-700 dark:text-gray-300">${groupTotal.toFixed(2)}</span></p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Items Table */}
                                {!isCollapsed && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-white dark:bg-slate-900 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-6 py-3 w-12"></th>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Description</th>
                                                    <th className="px-6 py-3 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                                {groupItems.map(item => {
                                                    const unitName = getUnitName(item);
                                                    return (
                                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group/row">
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItemIds.has(item.id)}
                                                                    onChange={() => handleSelectOne(item.id)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'New'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                        {unitName && <span className="text-blue-600 mr-1">[{unitName}]</span>}
                                                                        {item.description}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                                        <span className="uppercase tracking-wider">{item.sourceType}</span>
                                                                        {/* Placeholder for source ref if available later */}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="font-bold text-gray-900 dark:text-white">${item.totalAmount.toFixed(2)}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BillableItemsList;
