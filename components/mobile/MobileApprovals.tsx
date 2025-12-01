
import React, { useState, useMemo, useRef } from 'react';
import { Order, AdminUser, OrderStatus, Property, ItemApprovalStatus } from '../../types';
import { CheckCircleIcon, ChevronRightIcon, XCircleIcon, CheckIcon } from '../Icons';
import MobileOrderDetail from './MobileOrderDetail';

interface MobileApprovalsProps {
    orders: Order[];
    users: AdminUser[];
    properties: Property[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onApprovalDecision: (orderId: string, itemDecisions: Map<string, { status: ItemApprovalStatus; reason?: string }>) => void;
}

const getStatusTheme = (status: OrderStatus) => {
    const themes: { [key in OrderStatus]?: string } = {
        'Pending My Approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Pending Others': 'bg-blue-100 text-blue-800 border-blue-200',
        'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Needs Revision': 'bg-orange-100 text-orange-800 border-orange-200',
        'Rejected': 'bg-red-100 text-red-800 border-red-200',
    };
    return themes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const ApprovalSkeleton = () => (
    <div className="bg-white p-5 rounded-2xl mb-4 border border-gray-100 animate-pulse shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
    </div>
);

const SwipeableOrderCard: React.FC<{
    order: Order;
    onSelect: () => void;
    submitterName: string;
    onApprove: () => void;
    onReject: () => void;
}> = ({ order, onSelect, submitterName, onApprove, onReject }) => {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);
    const hasVibrated = useRef(false); // To ensure we only vibrate once per threshold crossing

    const approveThreshold = 100;
    const rejectThreshold = 250;

    const isRejecting = -translateX > (approveThreshold + rejectThreshold) / 2;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
        hasVibrated.current = false;
        if (itemRef.current) itemRef.current.style.transition = 'none';
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const dx = currentX - touchStartX.current;

        // Swipe Left Logic (Negative dx)
        if (dx < 0) {
            // Add snapiness/haptics
            const absDx = Math.abs(dx);
            if (absDx > approveThreshold && !hasVibrated.current && absDx < rejectThreshold) {
                if (navigator.vibrate) navigator.vibrate(15);
                hasVibrated.current = true;
            }

            setTranslateX(dx);
        } else {
            // Resistance for right swipe (not allowed)
            setTranslateX(dx / 4);
        }
    };

    const onTouchEnd = () => {
        setIsSwiping(false);
        if (itemRef.current) itemRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Bouncy spring

        if (-translateX > rejectThreshold) {
            if (navigator.vibrate) navigator.vibrate([20, 50, 20]); // Double pulse
            onReject();
            setTranslateX(-window.innerWidth); // Swipe off screen
        } else if (-translateX > approveThreshold) {
            if (navigator.vibrate) navigator.vibrate(30); // Strong pulse
            onApprove();
            setTranslateX(-window.innerWidth); // Swipe off screen
        } else {
            setTranslateX(0);
        }
        touchStartX.current = 0;
    };

    const canSwipe = order.status === 'Pending My Approval';

    return (
        <div className="relative bg-white rounded-2xl overflow-hidden mb-4 touch-pan-y shadow-sm border border-gray-200">
            {/* Swipe Background Layer */}
            <div
                className={`absolute inset-y-0 right-0 h-full flex items-center justify-start pl-8 text-white font-bold text-lg transition-colors duration-300 w-full rounded-2xl ${isRejecting ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ zIndex: 0 }}
            >
                {isRejecting ? (
                    <div className="flex items-center animate-pulse ml-auto pr-8">
                        <XCircleIcon className="w-8 h-8 mr-3" /> Reject
                    </div>
                ) : (
                    <div className="flex items-center animate-pulse ml-auto pr-8">
                        <CheckIcon className="w-8 h-8 mr-3" /> Approve
                    </div>
                )}
            </div>

            {/* Main Card Layer */}
            <div
                ref={itemRef}
                onTouchStart={canSwipe ? onTouchStart : undefined}
                onTouchMove={canSwipe ? onTouchMove : undefined}
                onTouchEnd={canSwipe ? onTouchEnd : undefined}
                onClick={() => {
                    if (Math.abs(translateX) < 5) { // Prevent click if swiping
                        if (navigator.vibrate) navigator.vibrate(5);
                        onSelect();
                    }
                }}
                className="relative z-10 w-full text-left bg-white p-5 rounded-2xl flex justify-between items-center active:bg-gray-50"
                style={{ transform: `translateX(${translateX}px)` }}
            >
                <div className="flex-grow min-w-0 pr-4">
                    <div className="flex justify-between items-start mb-1">
                        <h2 className="font-bold text-gray-900 text-lg truncate leading-tight">{order.cartName}</h2>
                        <p className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap">${order.totalCost.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                        <span className="font-medium text-gray-700">{submitterName}</span> &bull; {order.submissionDate}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusTheme(order.status)}`}>
                            {order.status === 'Pending My Approval' ? 'Action Required' : order.status}
                        </span>
                        {canSwipe && <span className="text-[10px] text-gray-400 italic animate-pulse ml-auto">Swipe left to act</span>}
                    </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
        </div>
    );
};


const MobileApprovals: React.FC<MobileApprovalsProps> = ({ orders, users, onUpdateOrderStatus, onApprovalDecision, properties }) => {
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<'my-approvals' | 'all-pending' | 'history'>('my-approvals');

    // Simple loading simulation if orders is empty initially
    const [isLoading] = useState(orders.length === 0);

    const getUserName = (userId: string) => users?.find(u => u.id === userId)?.name || 'Unknown User';

    const filterButtons: { label: string; filter: typeof activeTab }[] = [
        { label: 'Mine', filter: 'my-approvals' },
        { label: 'All Pending', filter: 'all-pending' },
        { label: 'History', filter: 'history' },
    ];

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            switch (activeTab) {
                case 'my-approvals':
                    return order.status === 'Pending My Approval';
                case 'all-pending':
                    return order.status === 'Pending My Approval' || order.status === 'Pending Others';
                case 'history':
                    return ['Approved', 'Rejected', 'Needs Revision'].includes(order.status);
                default:
                    return false;
            }
        }).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
    }, [orders, activeTab]);

    if (viewingOrder) {
        return (
            <div className="animate-slide-in-right">
                <MobileOrderDetail
                    order={viewingOrder}
                    properties={properties}
                    onBack={() => setViewingOrder(null)}
                    onApprovalDecision={(decisions) => {
                        onApprovalDecision(viewingOrder.id, decisions);
                        setViewingOrder(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Approvals</h1>
                <p className="text-sm text-gray-500 mt-1">Swipe left to quickly approve or reject items.</p>
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full mb-6 shadow-inner">
                {filterButtons.map(({ label, filter }) => (
                    <button
                        key={filter}
                        onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(5);
                            setActiveTab(filter);
                        }}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === filter
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && orders.length === 0 ? (
                <div>
                    <ApprovalSkeleton />
                    <ApprovalSkeleton />
                    <ApprovalSkeleton />
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="pb-20">
                    {filteredOrders.map(order => (
                        <SwipeableOrderCard
                            key={order.id}
                            order={order}
                            onSelect={() => setViewingOrder(order)}
                            submitterName={getUserName(order.submittedBy)}
                            onApprove={() => onUpdateOrderStatus(order.id, 'Approved')}
                            onReject={() => onUpdateOrderStatus(order.id, 'Rejected')}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <div className="bg-gray-100 p-6 rounded-full mb-4 animate-bounce">
                        <CheckCircleIcon className="w-16 h-16 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                    <p className="text-sm text-gray-500 mt-2">No pending approvals found.</p>
                </div>
            )}
        </div>
    );
};

export default MobileApprovals;
