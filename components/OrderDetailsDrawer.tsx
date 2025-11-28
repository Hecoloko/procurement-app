
import React, { useState, useMemo, useEffect } from 'react';
import { Order, PurchaseOrder, CartItem, OrderStatus, PurchaseOrderStatus, Property, CommunicationThread, Message, AdminUser, ItemApprovalStatus, Vendor } from '../types';
import { XMarkIcon, ChevronUpIcon, ShipmentIcon, CommunicationIcon, CheckIcon, CheckCircleIcon } from './Icons';
import StatusTimeline from './StatusTimeline';
import OrderCommunication from './OrderCommunication';
import { usePermissions } from '../contexts/PermissionsContext';

const getTrackingUrl = (carrier: string, trackingNumber: string): string => {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower === 'ups') {
        return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
    }
    if (carrierLower === 'fedex') {
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    // A generic search fallback
    return `https://www.google.com/search?q=${carrier}+${trackingNumber}+tracking`;
};

const PurchaseOrderDetail: React.FC<{ po: PurchaseOrder, vendors: Vendor[] }> = ({ po, vendors }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const vendor = vendors?.find(v => v.id === po.vendorId);

    const poTimelineSteps: { key: PurchaseOrderStatus; label: string }[] = [
        { key: 'Issued', label: 'Ordered' },
        { key: 'Purchased', label: 'Purchased' },
        { key: 'In Transit', label: 'Shipped' },
        { key: 'Received', label: 'Delivered' },
    ];

    const getPoTimelineHistory = (po: PurchaseOrder) => {
        if (po.statusHistory && po.statusHistory.length > 0) {
            return po.statusHistory.map(h => ({ status: h.status, date: h.date }));
        }

        // Fallback: Infer history from current status
        const orderedPath: PurchaseOrderStatus[] = ['Issued', 'Purchased', 'In Transit', 'Received'];
        const currentStepIndex = orderedPath.indexOf(po.status);

        if (currentStepIndex === -1) return [];

        return orderedPath.slice(0, currentStepIndex + 1).map(status => ({
            status,
            date: '', // No date available, but the status key is what matters
        }));
    };

    const poHistory = getPoTimelineHistory(po);


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-4 text-left">
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{po.id}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vendor: <span className="font-medium text-gray-700 dark:text-gray-300">{vendor?.name || 'Unknown'}</span></p>
                </div>
                <ChevronUpIcon className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`} />
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="pt-2 pb-6">
                        <StatusTimeline
                            steps={poTimelineSteps}
                            history={poHistory}
                        />
                    </div>
                    <div className="mt-4">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="pb-2 text-left font-medium">Product</th>
                                    <th className="pb-2 text-center font-medium">Qty</th>
                                    <th className="pb-2 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {po.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-1.5 text-gray-800 dark:text-gray-100">{item.name}</td>
                                        <td className="py-1.5 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                        <td className="py-1.5 text-right font-semibold text-gray-800 dark:text-gray-100">${item.totalPrice.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {po.carrier && po.trackingNumber && (
                        <div className="mt-4">
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-xs">Shipment Tracking</h5>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-600 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-200 dark:bg-gray-600 p-2 rounded-full"><ShipmentIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Carrier</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{po.carrier}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tracking #</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{po.trackingNumber}</p>
                                    </div>
                                </div>
                                <a href={getTrackingUrl(po.carrier, po.trackingNumber)} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors duration-200 active:scale-95">
                                    Track
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const getStatusTheme = (status: ItemApprovalStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const DetailsTab: React.FC<{
    order: Order;
    properties: Property[];
    vendors: Vendor[];
    itemDecisions: Map<string, { status: 'Approved' | 'Rejected'; reason?: string }>;
    onDecisionChange: (itemId: string, decision: { status: 'Approved' | 'Rejected'; reason?: string }) => void;
    onApproveAll: () => void;
    onRejectAll: () => void;
    canProcure: boolean;
    onProcure: () => void;
    users: AdminUser[];
}> = ({ order, properties, vendors, itemDecisions, onDecisionChange, onApproveAll, onRejectAll, canProcure, onProcure, users }) => {
    const isApproverView = order?.status === 'Pending My Approval';
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    const handleReasonChange = (itemId: string, reason: string) => {
        setRejectionReasons(prev => ({ ...prev, [itemId]: reason }));
    };

    const handleRejectWithReason = (itemId: string) => {
        onDecisionChange(itemId, { status: 'Rejected', reason: rejectionReasons[itemId] || 'Rejected without reason' });
    }

    const unassignedItems = useMemo(() => {
        if (!order || !order.items) return [];
        if (!order.purchaseOrders || order.purchaseOrders.length === 0) {
            return (order.status !== 'Completed' && order.status !== 'Rejected' && order.status !== 'Draft' && order.status !== 'Ready for Review' && order.status !== 'Submitted' && order.status !== 'Pending My Approval' && order.status !== 'Pending Others') ? order.items : [];
        }

        const assignedItemIds = new Set(
            order.purchaseOrders.flatMap(po => po.items.map(item => item.id))
        );

        return order.items.filter(item => !assignedItemIds.has(item.id));
    }, [order]);

    const isPreProcessing = useMemo(() => {
        const preProcessingStatuses: OrderStatus[] = ['Draft', 'Ready for Review', 'Submitted', 'Pending My Approval', 'Pending Others', 'Rejected', 'Needs Revision'];
        return preProcessingStatuses.includes(order.status);
    }, [order]);

    // Updated to match the requested flow
    const orderTimelineSteps: { key: string, label: string }[] = [
        { key: 'Submitted', label: 'Pending Approval' },
        { key: 'Approved', label: 'Awaiting Purchase' },
        { key: 'Processing', label: 'In Progress Purchase' },
        { key: 'Shipped', label: 'In Transit' },
        { key: 'Completed', label: 'Completed' },
    ];

    const getOrderStatusHistoryForTimeline = (order: Order | null): { status: string; date: string; }[] => {
        if (!order) return [];
        if (order.statusHistory && order.statusHistory.length > 0) {
            const milestoneStatuses: OrderStatus[] = ['Submitted', 'Approved', 'Processing', 'Shipped', 'Completed'];
            const milestoneDates = new Map<string, string>();

            order.statusHistory.forEach(h => {
                let milestone: string | null = null;
                if (['Submitted', 'Pending My Approval', 'Pending Others', 'Ready for Review', 'Needs Revision'].includes(h.status)) {
                    milestone = 'Submitted';
                } else if (milestoneStatuses.includes(h.status)) {
                    milestone = h.status;
                }

                if (milestone && !milestoneDates.has(milestone)) {
                    milestoneDates.set(milestone, h.date);
                }
            });
            return Array.from(milestoneDates.entries()).map(([status, date]) => ({ status, date }));
        }
        const orderedPath: OrderStatus[] = ['Submitted', 'Approved', 'Processing', 'Shipped', 'Completed'];
        const statusMap: Partial<Record<OrderStatus, number>> = { 'Submitted': 0, 'Pending My Approval': 0, 'Pending Others': 0, 'Ready for Review': 0, 'Approved': 1, 'Processing': 2, 'Shipped': 3, 'Completed': 4, 'Needs Revision': 0 };
        const currentStepIndex = statusMap[order.status];
        if (typeof currentStepIndex !== 'number') return [];
        return orderedPath.slice(0, currentStepIndex + 1).map(status => ({ status, date: order.submissionDate }));
    };

    const timelineHistory = getOrderStatusHistoryForTimeline(order);
    return (
        <div className="space-y-6 pb-24">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-base px-2">Order Status</h3>
                <StatusTimeline steps={orderTimelineSteps} history={timelineHistory} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 text-base">Order Summary</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Submitted By:</div><div className="font-semibold text-gray-800 dark:text-gray-100">{users?.find(u => u.id === order?.submittedBy)?.name || order?.submittedBy || 'Unknown'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Property:</div><div className="font-semibold text-gray-800 dark:text-gray-100">{properties?.find(p => p.id === order?.propertyId)?.name || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Date:</div><div className="font-semibold text-gray-800 dark:text-gray-100">{order?.submissionDate}</div>
                    <div className="text-gray-500 dark:text-gray-400">Total Cost:</div><div className="font-bold text-gray-900 dark:text-gray-100">${order?.totalCost.toFixed(2)}</div>
                    <div className="text-gray-500 dark:text-gray-400">Status:</div><div className="font-semibold text-gray-800 dark:text-gray-100">{order?.status}</div>
                </div>
            </div>

            {isPreProcessing ? (
                order?.items && order.items.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Items for Approval</h3>
                            {isApproverView && (
                                <div className="flex items-center gap-2">
                                    <button onClick={onApproveAll} className="text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 px-4 py-1.5 rounded-full transition-colors">Approve All</button>
                                    <button onClick={onRejectAll} className="text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1.5 rounded-full transition-colors">Reject All</button>
                                </div>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {order.items.map(item => {
                                const decision = itemDecisions.get(item.id);
                                const status: ItemApprovalStatus = decision?.status || item.approvalStatus || 'Pending';
                                const reason = decision?.reason || item.rejectionReason;
                                const isPendingForApproval = (item.approvalStatus || 'Pending') === 'Pending';
                                return (
                                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">{item.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.quantity} x ${item.unitPrice.toFixed(2)} = <span className="font-semibold text-gray-700 dark:text-gray-300">${item.totalPrice.toFixed(2)}</span></p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${getStatusTheme(status)}`}>{status}</span>
                                        </div>
                                        {status === 'Rejected' && reason && <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-100">Reason: {reason}</p>}

                                        {isApproverView && isPendingForApproval && !decision && (
                                            <div className="mt-4 flex items-center gap-4">
                                                <button onClick={() => onDecisionChange(item.id, { status: 'Approved' })} className="text-sm font-semibold text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded">Approve</button>
                                                <div className="w-px h-4 bg-gray-300"></div>
                                                <button onClick={() => setRejectionReasons(prev => ({ ...prev, [item.id]: '' }))} className="text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded">Reject</button>
                                            </div>
                                        )}
                                        {isApproverView && isPendingForApproval && rejectionReasons[item.id] !== undefined && !decision && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <input type="text" placeholder="Reason for rejection (optional)" value={rejectionReasons[item.id]} onChange={e => handleReasonChange(item.id, e.target.value)} className="flex-grow text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 p-1.5" autoFocus />
                                                <button onClick={() => handleRejectWithReason(item.id)} className="px-3 py-1.5 text-sm font-bold bg-red-500 text-white rounded-md hover:bg-red-600">Confirm Reject</button>
                                                <button onClick={() => { const newReasons = { ...rejectionReasons }; delete newReasons[item.id]; setRejectionReasons(newReasons); }} className="text-xs text-gray-500 underline">Cancel</button>
                                            </div>
                                        )}
                                        {isApproverView && decision && (
                                            <button onClick={() => onDecisionChange(item.id, undefined as any)} className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">Undo Decision</button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Procurement & Items</h3>
                            <div className="flex gap-2">
                                {canProcure && unassignedItems.length === 0 && (
                                    <button onClick={onProcure} className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-bold py-2 px-3 text-xs rounded-lg transition-colors border border-gray-300 dark:border-gray-600">
                                        Manage POs
                                    </button>
                                )}
                                {canProcure && unassignedItems.length > 0 && (
                                    <button onClick={onProcure} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 text-xs rounded-lg transition-colors">
                                        Procure Items
                                    </button>
                                )}
                            </div>
                        </div>
                        {unassignedItems.length > 0 ? (
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {unassignedItems.map(item => (
                                        <tr key={item.id}>
                                            <td className="p-3 text-gray-800 dark:text-gray-100">{item.name}</td>
                                            <td className="p-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                            <td className="p-3 text-right font-semibold text-gray-800 dark:text-gray-100">${item.totalPrice.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                All items have been assigned to purchase orders.
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Purchase Orders</h3>
                        {order?.purchaseOrders && order.purchaseOrders.length > 0 ? (
                            <div className="space-y-4">{order.purchaseOrders.map(po => <PurchaseOrderDetail key={po.id} po={po} vendors={vendors} />)}</div>
                        ) : (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">No purchase orders have been generated.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

interface OrderDetailsDrawerProps {
    order: Order | null;
    onClose: () => void;
    properties: Property[];
    users: AdminUser[];
    threads: CommunicationThread[];
    messages: Message[];
    currentUser: AdminUser;
    onSendMessage: (orderId: string, content: string, taggedUserIds?: string[]) => void;
    orders: Order[];
    onSelectOrder: (order: Order) => void;
    onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
    onApprovalDecision?: (orderId: string, itemDecisions: Map<string, { status: ItemApprovalStatus; reason?: string }>) => void;
    onProcureOrder: (order: Order) => void;
    vendors: Vendor[];
}


const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({ order, onClose, properties, users, threads, messages, currentUser, onSendMessage, orders, onSelectOrder, onUpdateOrderStatus, onApprovalDecision, onProcureOrder, vendors }) => {
    const isOpen = !!order;
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [itemDecisions, setItemDecisions] = useState<Map<string, { status: 'Approved' | 'Rejected'; reason?: string }>>(new Map());
    const { can } = usePermissions();

    const orderThread = useMemo(() => {
        if (!order || !order.threadId) return null;
        return threads.find(t => t.id === order.threadId);
    }, [order, threads]);

    const threadMessages = useMemo(() => {
        if (!orderThread) return [];
        return messages.filter(m => m.threadId === orderThread.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [orderThread, messages]);

    useEffect(() => {
        setItemDecisions(new Map());
    }, [order]);

    const handleDecisionChange = (itemId: string, decision: { status: 'Approved' | 'Rejected'; reason?: string } | undefined) => {
        setItemDecisions(prev => {
            const newMap = new Map(prev);
            if (decision === undefined) {
                newMap.delete(itemId);
            } else {
                newMap.set(itemId, decision);
            }
            return newMap;
        });
    };

    const handleProcure = () => {
        if (order) {
            onClose();
            onProcureOrder(order);
        }
    };

    const pendingItems = useMemo(() => order?.items?.filter(i => (i.approvalStatus || 'Pending') === 'Pending') || [], [order]);

    const handleApproveAll = () => {
        setItemDecisions(prev => {
            const newMap = new Map(prev);
            pendingItems.forEach(item => newMap.set(item.id, { status: 'Approved' }));
            return newMap;
        });
    };

    const handleRejectAll = () => {
        setItemDecisions(prev => {
            const newMap = new Map(prev);
            pendingItems.forEach(item => newMap.set(item.id, { status: 'Rejected', reason: 'Rejected as part of bulk action' }));
            return newMap;
        });
    };

    const handleSubmitDecisions = () => {
        if (order && onApprovalDecision) {
            onApprovalDecision(order.id, itemDecisions);
            onClose();
        }
    };

    // Logic to enable submit: if there are pending items, they must all be decided. 
    // If there are NO pending items (e.g., re-approving or stuck state), allow submit to potentially clear status.
    const allPendingDecided = pendingItems.length === 0 || pendingItems.every(i => itemDecisions.has(i.id));

    return (
        <div className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-gray-50 dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-start">
                        <div>
                            <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100">{order?.cartName}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ORD: {order?.id}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                        <nav className="-mb-px flex space-x-6 px-6">
                            <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'details' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Details</button>
                            <button onClick={() => setActiveTab('communication')} className={`py-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 ${activeTab === 'communication' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><CommunicationIcon className="w-5 h-5" />Communication</button>
                        </nav>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {order && activeTab === 'details' && <DetailsTab order={order} properties={properties} itemDecisions={itemDecisions} onDecisionChange={handleDecisionChange} onApproveAll={handleApproveAll} onRejectAll={handleRejectAll} canProcure={can('orders:procure')} onProcure={handleProcure} vendors={vendors} users={users} />}
                        {order && activeTab === 'communication' && (
                            <OrderCommunication
                                order={order}
                                thread={orderThread || null}
                                messages={threadMessages}
                                users={users}
                                currentUser={currentUser}
                                onSendMessage={onSendMessage}
                                orders={orders}
                                onSelectOrder={onSelectOrder}
                            />
                        )}
                    </div>

                    {order?.status === 'Pending My Approval' && onApprovalDecision && activeTab === 'details' && (
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500 font-medium">
                                    {itemDecisions.size} decision{itemDecisions.size !== 1 && 's'} made
                                </div>
                                <button
                                    onClick={handleSubmitDecisions}
                                    disabled={!allPendingDecided}
                                    className="px-8 py-3 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Submit Decisions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsDrawer;
