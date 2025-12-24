
import React, { useState, useMemo, useEffect } from 'react';
import { Cart, CartStatus, CartType, Property, Order } from '../types';
import {
    CartIcon, RefreshIcon, CalendarIcon, PlusCircleIcon, TrashIcon,
    BuildingOfficeIcon, CheckCircleIcon, ClockIcon, PencilIcon,
    EyeIcon, PaperAirplaneIcon, XCircleIcon, ShipmentIcon, CheckBadgeIcon
} from './Icons';
import { usePermissions } from '../contexts/PermissionsContext';

// Helper to get theme colors based on cart type for better differentiation
const getCartTypeTheme = (type: CartType) => {
    switch (type) {
        case 'Recurring':
            return {
                Icon: RefreshIcon,
                border: 'border-blue-500/30',
                bg: 'bg-blue-500/5',
                text: 'text-blue-600 dark:text-blue-400',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
            };
        case 'Scheduled':
            return {
                Icon: CalendarIcon,
                border: 'border-purple-500/30',
                bg: 'bg-purple-500/5',
                text: 'text-purple-600 dark:text-purple-400',
                badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
            };
        default:
            return {
                Icon: CartIcon,
                border: 'border-emerald-500/30',
                bg: 'bg-emerald-500/5',
                text: 'text-emerald-600 dark:text-emerald-400',
                badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
            };
    }
};

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'Draft':
            return {
                icon: PencilIcon,
                className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            };
        case 'Ready for Review':
            return {
                icon: EyeIcon,
                className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
            };
        case 'Submitted':
            return {
                icon: PaperAirplaneIcon,
                className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            };
        case 'Pending My Approval':
        case 'Pending Others':
            return {
                icon: ClockIcon,
                className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
            };
        case 'Approved':
            return {
                icon: CheckCircleIcon,
                className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            };
        case 'Rejected':
        case 'Needs Revision':
            return {
                icon: XCircleIcon,
                className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
            };
        case 'Shipped':
        case 'In Transit':
            return {
                icon: ShipmentIcon,
                className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
            };
        case 'Completed':
        case 'Received':
            return {
                icon: CheckBadgeIcon,
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            };
        default:
            return {
                icon: ClockIcon,
                className: 'bg-gray-100 text-gray-600 border-gray-200'
            };
    }
}

const getScheduleSummary = (cart: Cart): string | null => {
    if (cart.type === 'Scheduled' && cart.scheduledDate) {
        return `Scheduled: ${new Date(cart.scheduledDate).toLocaleDateString()}`;
    }
    if (cart.type === 'Recurring' && cart.frequency) {
        return `${cart.frequency} Recurring`;
    }
    return null;
}

import DeleteConfirmationModal from './DeleteConfirmationModal';

// New Component: CartStatusBadge that checks associated Order status
const CartStatusBadge: React.FC<{ cart: Cart, linkedOrder?: Order }> = ({ cart, linkedOrder }) => {
    let displayStatus: string = cart.status;

    // If linkedOrder exists, show its status instead of just "Submitted"
    if (linkedOrder) {
        displayStatus = linkedOrder.status;
    }

    const config = getStatusConfig(displayStatus);
    const Icon = config.icon;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md border ${config.className}`}>
            <Icon className="w-3 h-3" />
            {displayStatus}
        </span>
    );
};


const CartCard: React.FC<{
    cart: Cart;
    onSelectCart: (cart: Cart) => void;
    isSelected: boolean;
    onToggleSelect: (cartId: string) => void;
    property?: Property;
    linkedOrder?: Order;
    onDeleteRequest: (id: string, isOrder: boolean, hasLinkedOrder: boolean) => void;
    onReuseCart: (cartId: string) => void;
}> = ({ cart, onSelectCart, isSelected, onToggleSelect, property, linkedOrder, onDeleteRequest, onReuseCart }) => {
    const theme = getCartTypeTheme(cart.type);
    const { Icon } = theme;
    const scheduleSummary = getScheduleSummary(cart);

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSelect(cart.id);
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteRequest(cart.id, !!linkedOrder && linkedOrder.id === cart.id, !!linkedOrder);
    };

    const handleReuseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Create a new draft from this cart?")) {
            onReuseCart(cart.id);
        }
    };

    return (
        <div
            onClick={() => onSelectCart(cart)}
            className={`group relative flex flex-col bg-card rounded-xl transition-all duration-300 cursor-pointer border shadow-sm overflow-hidden
        ${isSelected ? 'ring-2 ring-primary border-transparent scale-[1.02] shadow-lg' : `border-border hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 hover:scale-[1.02]`}
      `}
        >
            {/* Colored Top Accent with Gradient */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${theme.bg.replace('bg-', 'from-').replace('/5', '/80')} to-transparent dark:${theme.bg.replace('bg-', 'from-').replace('/5', '/50')}`}></div>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${theme.bg} ${theme.text}`}>
                        <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2 -mr-2 -mt-2">
                        {/* Reuse Button */}
                        <button
                            onClick={handleReuseClick}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors z-10"
                            title="Reuse / Clone Cart"
                        >
                            <RefreshIcon className="w-4 h-4" />
                        </button>

                        {/* Delete Button - Always Visible & Red for Clarity */}
                        <button
                            onClick={handleDeleteClick}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors z-10"
                            title="Delete"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>

                        {/* Checkbox */}
                        <div onClick={handleCheckboxClick} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => { }}
                                className="h-4 w-4 rounded border-muted-foreground/30 bg-background text-primary focus:ring-primary cursor-pointer pointer-events-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-base text-foreground leading-tight mb-1 truncate group-hover:text-primary transition-colors">{cart.name}</h3>
                    {cart.workOrderId && (
                        <p className="text-xs font-mono text-muted-foreground mb-1">#{cart.workOrderId}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {property && (
                            <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="w-3 h-3" /> {property.name}
                            </span>
                        )}
                        {scheduleSummary && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                <span>{scheduleSummary}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-auto flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Total</p>
                        <p className="text-lg font-bold text-foreground">${cart.totalCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{cart.itemCount} item{cart.itemCount !== 1 && 's'}</p>
                    </div>
                    <CartStatusBadge cart={cart} linkedOrder={linkedOrder} />
                </div>
            </div>
        </div>
    );
};

interface MyCartsProps {
    carts: Cart[];
    setCarts: React.Dispatch<React.SetStateAction<Cart[]>>;
    onSelectCart: (cart: Cart) => void;
    onOpenCreateCartModal: () => void;
    onBulkSubmit: (cartIds: string[]) => void;
    initialStatusFilter?: 'All' | 'Needs Attention';
    properties: Property[];
    orders?: Order[];
    onDeleteCart: (cartId: string) => void;
    onDeleteOrder?: (orderId: string) => void;
    onBulkDeleteCarts: (cartIds: string[]) => void;
    onReuseCart: (cartId: string) => void;
}

const MyCarts: React.FC<MyCartsProps> = ({ carts, setCarts, onSelectCart, onOpenCreateCartModal, onBulkSubmit, initialStatusFilter, properties, orders = [], onDeleteCart, onDeleteOrder, onBulkDeleteCarts, onReuseCart }) => {
    const [activeTab, setActiveTab] = useState<'active' | 'cart_history' | 'order_history'>('active');
    const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());
    const { can } = usePermissions();

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; isOrder: boolean; message: string }>({
        isOpen: false, id: '', isOrder: false, message: ''
    });

    // Filter Logic
    const filteredItems = useMemo(() => {
        if (activeTab === 'active') {
            return carts.filter(cart => ['Draft', 'Ready for Review'].includes(cart.status));
        }
        if (activeTab === 'cart_history') {
            // Show carts that are in progress or rejected, but not yet fully converted to orders (or keep all non-drafts)
            // Excluding 'Draft' and 'Ready for Review'.
            // Also excluding 'Completed' if that implies Order? 
            // For now, let's show all non-drafts in Cart History.
            return carts.filter(cart => !['Draft', 'Ready for Review'].includes(cart.status));
        }
        if (activeTab === 'order_history') {
            // Return orders. We will map them to a displayable format in the render loop.
            return orders;
        }
        return [];
    }, [carts, orders, activeTab]);

    const handleToggleCartSelection = (cartId: string) => {
        setSelectedCarts(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(cartId)) newSelected.delete(cartId);
            else newSelected.add(cartId);
            return newSelected;
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedCarts.size === filteredItems.length) setSelectedCarts(new Set());
        else setSelectedCarts(new Set(filteredItems.map(c => c.id)));
    };

    const handleBulkSubmit = () => {
        if (activeTab !== 'active') return;
        const submittableIds = Array.from(selectedCarts);
        if (submittableIds.length === 0) return;

        if (window.confirm(`Submit ${submittableIds.length} cart(s) for approval?`)) {
            onBulkSubmit(submittableIds);
            setSelectedCarts(new Set());
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to permanently delete ${selectedCarts.size} selected item(s)?`)) {
            const idsToDelete = Array.from(selectedCarts);
            onBulkDeleteCarts(idsToDelete);
            setSelectedCarts(new Set());
        }
    };

    const requestDelete = (id: string, isOrderView: boolean, hasLinkedOrder: boolean) => {
        // If we are in Order History tab, we are definitely deleting an Order.
        // If we are in Cart History tab, we are deleting a Cart (which might have a linked order).

        const isOrder = activeTab === 'order_history';
        let message = '';

        if (isOrder) {
            message = "Are you sure you want to delete this order? This will permanently remove the order record.";
        } else {
            message = hasLinkedOrder ?
                'Warning: This cart has already been submitted as an order. Deleting it will also delete the associated order history. Are you sure?' :
                'Are you sure you want to delete this cart?';
        }

        setDeleteModal({ isOpen: true, id, isOrder, message });
    };

    const confirmDelete = () => {
        if (deleteModal.isOrder) {
            onDeleteOrder?.(deleteModal.id);
        } else {
            onDeleteCart(deleteModal.id);
        }
    };

    return (
        <>
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title={deleteModal.isOrder ? "Delete Order" : "Delete Cart"}
                message={deleteModal.message}
                itemType={deleteModal.isOrder ? 'Order' : 'Cart'}
            />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">My Carts</h1>
                    <p className="text-muted-foreground mt-2">Manage your procurement requests.</p>
                </div>
                {can('carts:create') && (
                    <button onClick={onOpenCreateCartModal} className="flex items-center bg-gradient-to-r from-primary to-yellow-500 hover:from-yellow-400 hover:to-primary text-primary-foreground font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300 active:scale-95 hover:-translate-y-0.5">
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        New Cart
                    </button>
                )}
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex p-1 bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab('active'); setSelectedCarts(new Set()); }}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Active Drafts
                    </button>
                    <button
                        onClick={() => { setActiveTab('cart_history'); setSelectedCarts(new Set()); }}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'cart_history' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Cart History
                    </button>
                    <button
                        onClick={() => { setActiveTab('order_history'); setSelectedCarts(new Set()); }}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'order_history' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Order History
                    </button>
                </div>

                {/* Bulk Actions (Only show if items selected) */}
                {selectedCarts.size > 0 && (
                    <div className="flex items-center gap-3 animate-fade-in">
                        <span className="text-sm font-medium text-muted-foreground">{selectedCarts.size} selected</span>
                        {activeTab === 'active' && can('carts:submit') && (
                            <button onClick={handleBulkSubmit} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">
                                Submit
                            </button>
                        )}
                        <button onClick={handleBulkDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold py-2 px-4 rounded-lg border border-red-500/20 transition-colors">
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Cart Grid */}
            {filteredItems.length > 0 ? (
                <>
                    {/* Select All Helper */}
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <input type="checkbox" id="select-all" checked={selectedCarts.size === filteredItems.length} onChange={handleToggleSelectAll} className="rounded border-muted-foreground/30 bg-card text-primary focus:ring-primary cursor-pointer" />
                        <label htmlFor="select-all" className="text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">Select All</label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeTab === 'order_history' ? (
                            // Render Orders
                            (filteredItems as any[]).map(order => {
                                // Use the cart inside the order, or fallback
                                // Note: Order interface might not have 'cart' property defined but it might be there at runtime.
                                // We cast to any to avoid TS errors and use safe fallbacks.
                                const displayCart: Cart = order.cart || {
                                    id: order.id,
                                    companyId: order.companyId,
                                    name: order.cartName || `Order ${order.id.slice(0, 8)}`,
                                    status: order.status as any, // Cast to match CartStatus if needed, or CartCard handles strings
                                    totalCost: order.totalCost || 0,
                                    itemCount: order.itemCount || 0,
                                    type: order.type || 'Standard',
                                    lastModified: order.submissionDate || new Date().toISOString(),
                                    items: order.items || [],
                                    propertyId: order.propertyId
                                };

                                return (
                                    <CartCard
                                        key={order.id}
                                        cart={displayCart}
                                        onSelectCart={() => { }}
                                        isSelected={selectedCarts.has(order.id)}
                                        onToggleSelect={() => handleToggleCartSelection(order.id)}
                                        property={properties.find(p => p.id === order.propertyId)}
                                        linkedOrder={order}
                                        onDeleteRequest={requestDelete}
                                        onReuseCart={onReuseCart}
                                    />
                                );
                            })
                        ) : (
                            // Render Carts
                            (filteredItems as Cart[]).map(cart => {
                                const linkedOrder = orders?.find(o => o.cartId === cart.id);
                                return (
                                    <CartCard
                                        key={cart.id}
                                        cart={cart}
                                        onSelectCart={onSelectCart}
                                        isSelected={selectedCarts.has(cart.id)}
                                        onToggleSelect={handleToggleCartSelection}
                                        property={properties.find(p => p.id === cart.propertyId)}
                                        linkedOrder={linkedOrder}
                                        onDeleteRequest={requestDelete}
                                        onReuseCart={onReuseCart}
                                    />
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-card/50 rounded-3xl border border-dashed border-border text-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <CartIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No items found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === 'active' ? "You don't have any active drafts." :
                            activeTab === 'cart_history' ? "No cart history available." : "No order history available."}
                    </p>
                    {activeTab === 'active' && can('carts:create') && (
                        <button onClick={onOpenCreateCartModal} className="mt-6 text-primary font-bold hover:underline">Start a new cart</button>
                    )}
                </div>
            )}
        </>
    );
};

export default MyCarts;
