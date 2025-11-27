

import React, { useState, useRef } from 'react';
import { Order, Property, PurchaseOrder, ItemApprovalStatus } from '../../types';
import { ChevronLeftIcon, CheckIcon, XCircleIcon } from '../Icons';

interface MobileOrderDetailProps {
    order: Order;
    properties: Property[];
    onBack: () => void;
    onApprovalDecision?: (itemDecisions: Map<string, { status: ItemApprovalStatus; reason?: string }>) => void;
}

type DetailTab = 'details' | 'items' | 'pos';

const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-green-500 text-white' : 'bg-[#2C2C2E] text-gray-300'}`}>
        {label}
    </button>
)

const getItemStatusTheme = (status: ItemApprovalStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-400/20 text-green-300';
        case 'Rejected': return 'bg-red-400/20 text-red-300';
        default: return 'bg-yellow-400/20 text-yellow-300';
    }
};

const SwipeableItem: React.FC<{
    item: Order['items'][0];
    onApprove: () => void;
    onReject: () => void;
}> = ({ item, onApprove, onReject }) => {
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);
    const threshold = 80;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
        if (itemRef.current) itemRef.current.style.transition = 'none';
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const dx = currentX - touchStartX.current;
        if (dx > -threshold * 2 && dx < threshold * 2) {
            setTranslateX(dx);
        }
    };

    const onTouchEnd = () => {
        setIsSwiping(false);
        if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s ease';

        if (translateX > threshold) {
            onApprove();
        } else if (translateX < -threshold) {
            onReject();
        } else {
            setTranslateX(0);
        }
        touchStartX.current = 0;
    };

    return (
         <div className="relative bg-[#2C2C2E] rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex justify-between items-center text-white font-bold">
                <div className="bg-green-600 h-full flex items-center px-6" style={{ opacity: Math.max(0, translateX / threshold) }}><CheckIcon className="w-5 h-5 mr-2"/>Approve</div>
                <div className="bg-red-600 h-full flex items-center px-6" style={{ opacity: Math.max(0, -translateX / threshold) }}><XCircleIcon className="w-5 h-5 mr-2"/>Reject</div>
            </div>
            <div
                ref={itemRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="relative bg-[#2C2C2E] flex justify-between items-center text-sm p-3 border border-gray-700/50 rounded-xl"
                style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
            >
                <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-gray-400">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                </div>
                <p className="font-bold text-white">${item.totalPrice.toFixed(2)}</p>
            </div>
        </div>
    );
};


const MobileOrderDetail: React.FC<MobileOrderDetailProps> = ({ order, properties, onBack, onApprovalDecision }) => {
    const property = properties.find(p => p.id === order.propertyId);
    const [activeTab, setActiveTab] = useState<DetailTab>('items');
    const [itemDecisions, setItemDecisions] = useState<Map<string, { status: ItemApprovalStatus; reason?: string }>>(new Map());
    
    const isApproverView = order.status === 'Pending My Approval' && !!onApprovalDecision;

    const handleDecision = (itemId: string, status: 'Approved' | 'Rejected') => {
        let reason: string | undefined;
        if (status === 'Rejected') {
            reason = window.prompt('Reason for rejection (optional):') || 'Rejected without reason';
        }
        setItemDecisions(prev => new Map(prev).set(itemId, { status, reason }));
    };

    const handleUndo = (itemId: string) => {
        setItemDecisions(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
        });
    };
    
    const handleSubmitDecisions = () => {
        if (onApprovalDecision) {
            onApprovalDecision(itemDecisions);
        }
    };

    const pendingItemsCount = order.items.filter(item => (item.approvalStatus || 'Pending') === 'Pending').length;
    const allPendingDecided = itemDecisions.size === pendingItemsCount;


    return (
        <div className="fixed inset-0 bg-[#121212] z-60 flex flex-col font-sans">
            <header className="p-4 sticky top-0 bg-[#121212]/80 backdrop-blur-sm z-10">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-300 hover:text-white mb-4">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-white truncate">{order.cartName}</h1>
                <p className="text-sm text-gray-400">Order ID: {order.id}</p>
            </header>
            
             <nav className="px-4 pb-4 flex items-center gap-2 overflow-x-auto">
                <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                {order.items && <TabButton label={`Items (${order.itemCount})`} isActive={activeTab === 'items'} onClick={() => setActiveTab('items')} />}
                {order.purchaseOrders && order.purchaseOrders.length > 0 && <TabButton label="POs" isActive={activeTab === 'pos'} onClick={() => setActiveTab('pos')} />}
            </nav>

            <main className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-6">
                    {activeTab === 'details' && (
                        <div className="bg-[#1E1E1E] p-4 rounded-xl border border-gray-800">
                            <h3 className="font-bold text-lg mb-3 text-white">Order Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Property</span><span className="font-semibold text-white text-right">{property?.name || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Submitted</span><span className="font-semibold text-white">{order.submissionDate}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="font-semibold text-white">{order.status}</span></div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700 mt-2"><span className="text-gray-400">Total Cost</span><span className="font-bold text-xl text-white">${order.totalCost.toFixed(2)}</span></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'items' && order.items && (
                        <div className="space-y-3">
                            {order.items.map(item => {
                                const decision = itemDecisions.get(item.id);
                                const status = decision?.status || item.approvalStatus || 'Pending';
                                const isActionable = isApproverView && (item.approvalStatus || 'Pending') === 'Pending';

                                if (isActionable && !decision) {
                                    return <SwipeableItem key={item.id} item={item} onApprove={() => handleDecision(item.id, 'Approved')} onReject={() => handleDecision(item.id, 'Rejected')} />
                                }

                                return (
                                    <div key={item.id} className="bg-[#1E1E1E] p-3 rounded-xl border border-gray-800 text-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-white">{item.name}</p>
                                                <p className="text-gray-400">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold text-white">${item.totalPrice.toFixed(2)}</p>
                                        </div>
                                         <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
                                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getItemStatusTheme(status)}`}>{status}</span>
                                            {isActionable && decision && (
                                                <button onClick={() => handleUndo(item.id)} className="text-xs text-blue-400 hover:underline">Undo</button>
                                            )}
                                        </div>
                                        {status === 'Rejected' && (decision?.reason || item.rejectionReason) && (
                                            <p className="text-xs text-red-300 mt-2">Reason: {decision?.reason || item.rejectionReason}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'pos' && order.purchaseOrders && (
                        <div className="bg-[#1E1E1E] p-4 rounded-xl border border-gray-800">
                            <h3 className="font-bold text-lg mb-3 text-white">Purchase Orders</h3>
                            <div className="space-y-4">
                                {order.purchaseOrders.map(po => (
                                    <div key={po.id} className="pt-3 border-t border-gray-700/50 first:border-t-0 first:pt-0">
                                        <p className="font-bold text-white">{po.id}</p>
                                        <p className="text-sm text-gray-400">Status: <span className="font-semibold">{po.status}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {isApproverView && (
                <footer className="p-4 bg-[#1E1E1E]/80 backdrop-blur-sm border-t border-gray-700">
                    <button
                        onClick={handleSubmitDecisions}
                        disabled={!allPendingDecided}
                        className="w-full px-6 py-3.5 text-base font-bold text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Submit Decisions ({itemDecisions.size}/{pendingItemsCount})
                    </button>
                </footer>
            )}
        </div>
    );
};

export default MobileOrderDetail;