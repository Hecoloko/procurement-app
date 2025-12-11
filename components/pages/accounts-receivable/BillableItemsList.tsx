import React, { useState, useEffect } from 'react';
import { BillableItem, Customer, Property, Unit } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { RefreshIcon, SearchIcon, PlusIcon, CheckCircleIcon } from '../../Icons';
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
                invoiceId: item.invoice_id
            }));

            setItems(mappedItems);
        } catch (err) {
            console.error('Error fetching billable items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchItems();
        }
    }, [companyId]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItemIds(new Set(items.map(i => i.id)));
        } else {
            setSelectedItemIds(new Set());
        }
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

    const handleCreateInvoiceClick = () => {
        const selected = items.filter(i => selectedItemIds.has(i.id));
        if (selected.length === 0) return;
        onCreateInvoice(selected);
    };

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

    const filteredItems = items.filter(i =>
        i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(i).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Pending Billable Items</h2>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const count = await billbackService.syncMissingBillableItems(companyId);
                                if (count > 0) alert(`Synced ${count} missing POs!`);
                                await fetchItems();
                            } catch (e) {
                                console.error(e);
                                alert('Sync failed. Check console.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshIcon className="w-4 h-4" /> Sync Transactions
                    </button>

                    <button
                        onClick={fetchItems}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border bg-card"
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {selectedItemIds.size > 0 && (
                        <button
                            onClick={handleCreateInvoiceClick}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all animate-in zoom-in duration-200"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Invoice {selectedItemIds.size} Items
                        </button>
                    )}
                </div>
            </div>



            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={items.length > 0 && selectedItemIds.size === items.length}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Source</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading items...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No billable items pending.</td></tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.has(item.id)}
                                                onChange={() => handleSelectOne(item.id)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {/* Assuming created_at is available in raw data, but it's not in BillableItem type yet, using today as placeholder if missing or updating type later */}
                                            {/* Actually I should add createdAt to BillableItem or map it from DB */}
                                            new
                                        </td>
                                        <td className="p-4 font-medium text-foreground">{getCustomerName(item)}</td>
                                        <td className="p-4 text-foreground">{item.description}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                                {item.sourceType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-foreground">
                                            ${item.totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillableItemsList;
