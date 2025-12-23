import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, CartType, Property, AdminUser } from '../types';
import { SearchIcon, ChevronRightIcon, BuildingOfficeIcon } from './Icons';
import { Select } from './ui/Select';
import { usePermissions } from '../contexts/PermissionsContext';
import DeleteModal from './DeleteModal';

const getComprehensiveStatusTheme = (status: OrderStatus) => {
    switch (status) {
        case 'Pending My Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30';
        case 'Pending Others': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
        case 'Approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30';
        case 'Needs Revision': return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30';
        case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30';
        case 'Processing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30';
        case 'Partially Procured': return 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30';
        case 'Shipped': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30';
        case 'Completed': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
        case 'Draft': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
        case 'Ready for Review': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30';
        case 'Submitted': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
        case 'Scheduled': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    }
};

interface AllOrdersProps {
    orders: Order[];
    onProcureOrder: (order: Order) => void;
    onSelectOrder: (order: Order) => void;
    onDeleteOrder: (orderId: string) => void;
    initialStatusFilter?: OrderStatus | 'All';
    properties: Property[];
    users: AdminUser[];
}

const AllOrders: React.FC<AllOrdersProps> = ({ orders, onProcureOrder, onSelectOrder, onDeleteOrder, initialStatusFilter, properties, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>(initialStatusFilter || 'All');
    const [typeFilter, setTypeFilter] = useState<CartType | 'All'>('All');
    const { can, user } = usePermissions();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (initialStatusFilter) {
            setStatusFilter(initialStatusFilter);
        }
    }, [initialStatusFilter]);

    const filteredOrders = useMemo(() => {
        // Permission Logic: 'view-own' vs 'view' (all)
        const canViewAll = can('orders:view');
        const canViewOwn = can('orders:view-own');

        return orders.filter(order => {
            // Scope Check
            if (!canViewAll && canViewOwn) {
                if (order.submittedBy !== user?.id) return false;
            } else if (!canViewAll && !canViewOwn) {
                return false; // Should not happen if routed correctly
            }

            // Search Filter
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = order.cartName.toLowerCase().includes(lowerSearchTerm) ||
                order.submittedBy.toLowerCase().includes(lowerSearchTerm) ||
                order.id.toLowerCase().includes(lowerSearchTerm) ||
                order.cartId.toLowerCase().includes(lowerSearchTerm) ||
                (order.purchaseOrders && order.purchaseOrders.some(po => po.id.toLowerCase().includes(lowerSearchTerm)));

            // Status Filter
            const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

            // Type Filter
            const matchesType = typeFilter === 'All' || order.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [orders, searchTerm, statusFilter, typeFilter, can, user?.id]);

    const orderStatuses: (OrderStatus | 'All')[] = ['All', 'Draft', 'Submitted', 'Pending My Approval', 'Pending Others', 'Approved', 'Needs Revision', 'Rejected', 'Processing', 'Shipped', 'Completed', 'Scheduled'];
    const cartTypes: (CartType | 'All')[] = ['All', 'Standard', 'Recurring', 'Scheduled'];

    const handleProcureClick = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        onProcureOrder(order);
    };

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">All Orders</h1>
            <p className="text-muted-foreground mt-2 mb-8">Search, filter, and track all procurement orders across the organization.</p>

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
                                placeholder="Name, ID, PO, Cart..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-foreground mb-1">Status</label>
                        <Select
                            id="statusFilter"
                            name="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="typeFilter" className="block text-sm font-medium text-foreground mb-1">Type</label>
                        <Select
                            id="typeFilter"
                            name="typeFilter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            {cartTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="mt-6 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left">Order Details</th>
                                <th className="px-6 py-3 text-left">Submitted By</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Type</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onSelectOrder(order)}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{order.cartName}</div>
                                        <div className="text-xs text-muted-foreground mt-1 space-x-2 flex items-center flex-wrap">
                                            <span className="flex items-center gap-1.5"><BuildingOfficeIcon className="w-3 h-3" /> {properties?.find(p => p.id === order.propertyId)?.name || 'N/A'}</span>
                                            <span className="text-border">|</span>
                                            <span>ORD: <span className="font-mono font-medium text-primary">{order.id}</span></span>
                                            {order.purchaseOrders && order.purchaseOrders.length > 0 && (
                                                <>
                                                    <span className="text-border">|</span>
                                                    <span className="truncate">POs: <span className="font-mono font-medium text-primary">{order.purchaseOrders.map(po => po.id).join(', ')}</span></span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{users?.find(u => u.id === order.submittedBy)?.name || order.submittedBy || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{order.submissionDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-foreground">${order.totalCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getComprehensiveStatusTheme(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                                            {order.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(order.status === 'Approved' || order.status === 'Partially Procured') && can('orders:procure') && (
                                            <button
                                                onClick={(e) => handleProcureClick(e, order)}
                                                className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 text-xs rounded-lg transition-colors duration-200 active:scale-95 whitespace-nowrap shadow-md"
                                            >
                                                {order.status === 'Partially Procured' ? 'Resume Procurement' : 'Start Procurement'}
                                            </button>

                                        )}
                                        {can('orders:delete') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToDelete(order.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="ml-2 text-red-500 hover:text-red-700 font-bold py-2 px-3 text-xs rounded-lg transition-colors duration-200 active:scale-95 whitespace-nowrap"
                                                title="Delete Order"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                        <p className="font-semibold">No Orders Found</p>
                                        <p className="mt-1 text-sm">Try adjusting your search or filter criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setOrderToDelete(null);
                }}
                onConfirm={() => {
                    if (orderToDelete) {
                        onDeleteOrder(orderToDelete);
                    }
                }}
                title="Delete Order"
                message="Are you sure you want to delete this order? This action cannot be undone."
            />
        </>
    );
};

export default AllOrders;
