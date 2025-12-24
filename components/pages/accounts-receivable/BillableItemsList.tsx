import React, { useState, useEffect, useMemo } from 'react';
import { BillableItem, Customer, Property, Unit } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { RefreshIcon, SearchIcon, PlusIcon, CheckCircleIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, BuildingOfficeIcon, DocumentReportIcon } from '../../Icons';
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

    // Metadata for invoices/POs to display nice headers
    const [invoiceMetadata, setInvoiceMetadata] = useState<Record<string, { number: string; vendor: string; date: string; type: 'Invoice' | 'PO' }>>({});

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

            // 1. Fetch related Vendor Invoices
            const vendorInvoiceIds = mappedItems
                .filter(i => i.sourceType === 'VendorInvoice' && i.sourceId)
                .map(i => i.sourceId as string);

            // 2. Fetch related Purchase Orders
            const purchaseOrderIds = mappedItems
                .filter(i => i.sourceType === 'PurchaseOrder' && i.sourceId)
                .map(i => i.sourceId as string);

            const meta: Record<string, { number: string; vendor: string; date: string; type: 'Invoice' | 'PO' }> = {};

            if (vendorInvoiceIds.length > 0) {
                const uniqueIds = Array.from(new Set(vendorInvoiceIds));
                const { data: invData, error: invError } = await supabase
                    .from('vendor_invoices')
                    .select('id, invoice_number, invoice_date, vendors:vendor_id(name)')
                    .in('id', uniqueIds);

                if (!invError && invData) {
                    invData.forEach((inv: any) => {
                        meta[inv.id] = {
                            number: inv.invoice_number,
                            vendor: inv.vendors?.name || 'Unknown Vendor',
                            date: inv.invoice_date,
                            type: 'Invoice'
                        };
                    });
                }
            }

            if (purchaseOrderIds.length > 0) {
                const uniqueIds = Array.from(new Set(purchaseOrderIds));
                // Fetch PO details including invoice_number if available
                const { data: poData, error: poError } = await supabase
                    .from('purchase_orders')
                    .select('id, invoice_number, created_at, vendors:vendor_id(name)')
                    .in('id', uniqueIds);

                if (!poError && poData) {
                    poData.forEach((po: any) => {
                        // Use invoice_number if available, otherwise fallback to PO ID
                        const displayNum = po.invoice_number || `PO #${po.id.substring(0, 8)}`;
                        const isTrueInvoice = !!po.invoice_number;

                        meta[po.id] = {
                            number: displayNum,
                            vendor: po.vendors?.name || 'Unknown Vendor',
                            date: po.created_at,
                            type: isTrueInvoice ? 'Invoice' : 'PO'
                        };
                    });
                }
            }

            setInvoiceMetadata(meta);

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

        return 'General Items';
    };

    const getUnitName = (item: BillableItem) => {
        if (item.unitId) {
            return units.find(u => u.id === item.unitId)?.name || 'Unknown Unit';
        }
        return null;
    };

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Grouping Logic
    const groupedItems = useMemo(() => {
        const groups: Record<string, BillableItem[]> = {};

        // First, sort the master list based on preference
        const sortedItems = [...items].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        sortedItems.forEach(item => {
            let groupName = '';

            // Check if we have metadata for this source (either Invoice or PO)
            if ((item.sourceType === 'VendorInvoice' || item.sourceType === 'PurchaseOrder') && item.sourceId && invoiceMetadata[item.sourceId]) {
                const meta = invoiceMetadata[item.sourceId];
                // Group Header Logic
                if (meta.type === 'Invoice') {
                    // Clean up display if it's already "Invoice #..." or just the raw number
                    const num = meta.number.startsWith('Invoice #') ? meta.number : `Invoice #${meta.number}`;
                    groupName = num;
                } else {
                    groupName = meta.number; // e.g. "PO #123..."
                }
            } else {
                // Fallback to customer/property grouping for manual items or missing metadata
                const customerName = getCustomerName(item);
                groupName = `Manual/Other - ${customerName}`;
            }

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
    }, [items, searchTerm, properties, units, customers, sortOrder, invoiceMetadata]);

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
                    {/* Sort Toggle */}
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-border rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setSortOrder('newest')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${sortOrder === 'newest' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            Latest
                        </button>
                        <button
                            onClick={() => setSortOrder('oldest')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${sortOrder === 'oldest' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            Oldest
                        </button>
                    </div>

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
                    <button
                        onClick={async () => {
                            if (!window.confirm("This will reset markups to 0% for ALL Pending items. Continue?")) return;
                            setLoading(true);
                            try {
                                const count = await billbackService.resetPendingMarkups(companyId);
                                alert(`Reset markups for ${count} items.`);
                                await fetchItems();
                            } catch (e) {
                                console.error(e);
                                alert('Reset failed. Check console.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-border text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition items-center gap-2 shadow-sm text-red-600 hover:text-red-700"
                    >
                        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Fix Markups
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
                    placeholder="Search by invoice number, vendor, or item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area - Clean Table Layout */}
            {loading && items.length === 0 ? (
                <div className="text-center py-12">
                    <RefreshIcon className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading billable items...</p>
                </div>
            ) : sortedGroupKeys.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
                    <BuildingOfficeIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">No Pending Items</h3>
                    <p className="text-muted-foreground mt-1">Great job! All billable expenses have been processed.</p>
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    {/* Global Actions Bar inside the card header or just above table */}
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                        <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={items.length > 0 && selectedItemIds.size === items.length}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background"
                        />
                        <span className="text-sm font-medium text-foreground">Select All ({items.length} Items)</span>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 w-12"></th> {/* Checkbox column */}
                                <th className="px-6 py-4">Invoice # / Group</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Unbilled Items</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4 w-12"></th> {/* Expand Icon */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedGroupKeys.map(groupName => {
                                const groupItems = groupedItems[groupName];
                                const groupTotal = groupItems.reduce((sum, i) => sum + i.totalAmount, 0);
                                const allGroupSelected = groupItems.every(i => selectedItemIds.has(i.id));
                                const isCollapsed = collapsedGroups.has(groupName);

                                // Identify if this is linked to an invoice from our metadata
                                const representativeItem = groupItems[0];
                                const sourceId = representativeItem.sourceId;
                                const isMetaSource = (representativeItem.sourceType === 'VendorInvoice' || representativeItem.sourceType === 'PurchaseOrder');
                                const meta = (isMetaSource && sourceId) ? invoiceMetadata[sourceId] : null;

                                const displayGroup = groupName;
                                const displayDate = meta ? new Date(meta.date).toLocaleDateString() : (representativeItem.createdAt ? new Date(representativeItem.createdAt).toLocaleDateString() : '-');

                                return (
                                    <React.Fragment key={groupName}>
                                        {/* Main Group Row */}
                                        <tr
                                            className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => toggleGroup(groupName)}
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={allGroupSelected}
                                                    onChange={(e) => handleSelectGroup(groupName, e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    {meta ? <DocumentReportIcon className="w-4 h-4 text-blue-500" /> : <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />}
                                                    {displayGroup}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{displayDate}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                    {groupItems.length} Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-foreground">
                                                ${groupTotal.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {isCollapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                                            </td>
                                        </tr>

                                        {/* Expanded Items Rows */}
                                        {!isCollapsed && (
                                            <tr className="bg-muted/20">
                                                <td colSpan={6} className="p-0">
                                                    <div className="border-y border-border/50">
                                                        {/* Vendor Header inside expanded view */}
                                                        {meta && (
                                                            <div className="px-6 py-2.5 bg-background/50 border-b border-border/50 flex items-center gap-2 text-sm">
                                                                <span className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Vendor:</span>
                                                                <span className="font-semibold text-foreground">{meta.vendor}</span>
                                                            </div>
                                                        )}

                                                        <div className="px-6 py-2">
                                                            <table className="w-full text-xs bg-transparent">
                                                                <thead>
                                                                    <tr className="text-muted-foreground/70 uppercase">
                                                                        <th className="py-2 pl-2 text-left w-8"></th>
                                                                        <th className="py-2 text-left">Item Date</th>
                                                                        <th className="py-2 text-left">Vendor</th>
                                                                        <th className="py-2 text-left">Description</th>
                                                                        <th className="py-2 text-left">Property / Unit</th>
                                                                        <th className="py-2 text-right">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/30">
                                                                    {groupItems.map(item => {
                                                                        const unitName = getUnitName(item);
                                                                        const propertyName = properties.find(p => p.id === item.propertyId)?.name;
                                                                        const itemMeta = (item.sourceType === 'VendorInvoice' || item.sourceType === 'PurchaseOrder') && item.sourceId ? invoiceMetadata[item.sourceId] : null;
                                                                        const itemVendor = itemMeta ? itemMeta.vendor : '-';

                                                                        return (
                                                                            <tr key={item.id} className="hover:bg-muted/40">
                                                                                <td className="py-3 pl-2">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedItemIds.has(item.id)}
                                                                                        onChange={() => handleSelectOne(item.id)}
                                                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background"
                                                                                    />
                                                                                </td>
                                                                                <td className="py-3 text-muted-foreground">
                                                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                                                                </td>
                                                                                <td className="py-3 text-muted-foreground font-medium">
                                                                                    {itemVendor}
                                                                                </td>
                                                                                <td className="py-3 font-medium text-foreground">
                                                                                    {item.description}
                                                                                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{item.sourceType}</div>
                                                                                </td>
                                                                                <td className="py-3 text-muted-foreground">
                                                                                    {propertyName} {unitName && <span className="opacity-70 mx-1">/</span>} {unitName}
                                                                                </td>
                                                                                <td className="py-3 text-right font-mono">
                                                                                    ${item.totalAmount.toFixed(2)}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BillableItemsList;
