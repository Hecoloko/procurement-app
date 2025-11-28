
import React, { useState, useMemo, useEffect } from 'react';
import { Order, PurchaseOrder, PurchaseOrderStatus, Vendor, Property } from '../types';
import { SearchIcon, ChevronRightIcon, BuildingOfficeIcon } from './Icons';

const getPOStatusTheme = (status: PurchaseOrderStatus) => {
    switch (status) {
        case 'Issued': return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/20';
        case 'Purchased': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
        case 'In Transit': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30';
        case 'Received': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30';
        default: return 'bg-muted text-muted-foreground border border-border';
    }
}

interface AugmentedPO extends PurchaseOrder {
    parentOrder: {
        id: string;
        cartName: string;
        propertyId: string;
    }
}

interface PurchaseOrdersProps {
    orders: Order[];
    vendors: Vendor[];
    onSelectOrder: (order: Order) => void;
    initialStatusFilter?: PurchaseOrderStatus | 'All';
    properties: Property[];
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ orders, vendors, onSelectOrder, initialStatusFilter, properties }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'All'>(initialStatusFilter || 'All');
    const [vendorFilter, setVendorFilter] = useState<string | 'All'>('All');

    useEffect(() => {
        if (initialStatusFilter) {
            setStatusFilter(initialStatusFilter);
        }
    }, [initialStatusFilter]);

    const allPurchaseOrders = useMemo((): AugmentedPO[] => {
        return orders.flatMap(order =>
            order.purchaseOrders ? order.purchaseOrders.map(po => ({
                ...po,
                parentOrder: {
                    id: order.id,
                    cartName: order.cartName,
                    propertyId: order.propertyId,
                }
            })) : []
        );
    }, [orders]);

    const filteredPOs = useMemo(() => {
        return allPurchaseOrders.filter(po => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const vendor = vendors?.find(v => v.id === po.vendorId);
            const matchesSearch = po.id.toLowerCase().includes(lowerSearchTerm) ||
                po.parentOrder.id.toLowerCase().includes(lowerSearchTerm) ||
                po.parentOrder.cartName.toLowerCase().includes(lowerSearchTerm) ||
                (vendor && vendor.name.toLowerCase().includes(lowerSearchTerm));
            const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
            const matchesVendor = vendorFilter === 'All' || po.vendorId === vendorFilter;

            return matchesSearch && matchesStatus && matchesVendor;
        });
    }, [allPurchaseOrders, searchTerm, statusFilter, vendorFilter, vendors]);

    const handleRowClick = (po: AugmentedPO) => {
        const parentOrder = orders?.find(o => o.id === po.parentOrder.id);
        if (parentOrder) {
            onSelectOrder(parentOrder);
        }
    };

    const poStatuses: (PurchaseOrderStatus | 'All')[] = ['All', 'Issued', 'Purchased', 'In Transit', 'Received'];
    const vendorOptions: (Vendor | { id: 'All', name: 'All Vendors' })[] = [{ id: 'All', name: 'All Vendors' }, ...vendors];

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Purchase Orders</h1>
            <p className="text-muted-foreground mt-2 mb-8">Track all individual Purchase Orders (POs) sent to vendors.</p>

            {/* Filter and Search Bar */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                                placeholder="PO #, Order Name, Vendor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-foreground mb-1">Status</label>
                        <select
                            id="statusFilter"
                            name="statusFilter"
                            className="block w-full pl-3 pr-10 py-2 text-base border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            {poStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="vendorFilter" className="block text-sm font-medium text-foreground mb-1">Vendor</label>
                        <select
                            id="vendorFilter"
                            name="vendorFilter"
                            className="block w-full pl-3 pr-10 py-2 text-base border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm cursor-pointer"
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value as any)}
                        >
                            {vendorOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* POs Table */}
            <div className="mt-6 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left">PO #</th>
                                <th className="px-6 py-3 text-left">Original Order</th>
                                <th className="px-6 py-3 text-left">Vendor</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Items</th>
                                <th className="px-6 py-3 text-left">ETA</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPOs.length > 0 ? filteredPOs.map(po => (
                                <tr key={po.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleRowClick(po)}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-lg text-primary font-mono">{po.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-foreground">{po.parentOrder.cartName}</div>
                                        <div className="text-xs text-muted-foreground">ORD: {po.parentOrder.id}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                            <BuildingOfficeIcon className="w-3 h-3" />
                                            {properties?.find(p => p.id === po.parentOrder.propertyId)?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground font-medium">{vendors?.find(v => v.id === po.vendorId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPOStatusTheme(po.status)}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-foreground font-medium">
                                        {po.items.length}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{po.eta || 'N/A'}</td>
                                    <td className="px-4 py-4">
                                        <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <p className="font-semibold">No Purchase Orders Found</p>
                                        <p className="mt-1 text-sm">Try adjusting your search or filter criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default PurchaseOrders;
