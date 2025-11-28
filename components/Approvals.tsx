
import React, { useState } from 'react';
import { Order, OrderStatus, AdminUser, Property } from '../types';
import { CheckCircleIcon, ChevronRightIcon } from './Icons';

const getStatusTheme = (status: OrderStatus) => {
    switch (status) {
        case 'Pending My Approval':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30';
        case 'Pending Others':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
        case 'Approved':
            return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30';
        case 'Rejected':
            return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

const ApprovalCard: React.FC<{ order: Order, onSelect: () => void, submitterName: string }> = ({ order, onSelect, submitterName }) => (
    <button onClick={onSelect} className="w-full text-left bg-card p-5 rounded-xl shadow-sm border border-border transition-all duration-200 hover:bg-muted/40 hover:scale-[1.01]">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h3 className="font-bold text-lg text-foreground">{order.cartName}</h3>
                <p className="text-sm text-muted-foreground mt-1">Submitted by <span className="font-medium text-foreground">{submitterName}</span> on {order.submissionDate}</p>
                <span className={`mt-3 inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusTheme(order.status)}`}>
                    {order.status}
                </span>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="font-bold text-2xl text-foreground">${order.totalCost.toFixed(2)}</p>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-end text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            View Details <ChevronRightIcon className="w-5 h-5 ml-1" />
        </div>
    </button>
);

interface ApprovalsProps {
    orders: Order[];
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onSelectOrder: (order: Order) => void;
    users: AdminUser[];
    properties: Property[];
    initialFilter?: 'my-approvals' | 'all-pending' | 'history';
}

const Approvals: React.FC<ApprovalsProps> = ({ orders, onUpdateOrderStatus, onSelectOrder, users, properties, initialFilter }) => {
    const [activeTab, setActiveTab] = useState<'my-approvals' | 'all-pending' | 'history'>(initialFilter || 'my-approvals');

    const filterButtons: { label: string; filter: typeof activeTab }[] = [
        { label: 'My Approvals', filter: 'my-approvals' },
        { label: 'All Pending', filter: 'all-pending' },
        { label: 'History', filter: 'history' },
    ];

    const filteredApprovals = orders.filter(order => {
        switch (activeTab) {
            case 'my-approvals':
                return order.status === 'Pending My Approval';
            case 'all-pending':
                return order.status === 'Pending My Approval' || order.status === 'Pending Others';
            case 'history':
                return order.status === 'Approved' || order.status === 'Rejected';
        }
    });

    const getUserName = (userId: string) => users?.find(u => u.id === userId)?.name || 'Unknown User';

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Approvals Workbench</h1>
            <p className="text-muted-foreground mt-2 mb-8">Review and process procurement orders waiting for your action.</p>

            <div className="flex items-center bg-card p-1 rounded-lg max-w-md border border-border shadow-sm">
                {filterButtons.map(({ label, filter }) => (
                    <button
                        key={filter}
                        onClick={() => setActiveTab(filter)}
                        className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === filter
                                ? 'bg-muted text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {filteredApprovals.length > 0 ? (
                    <div className="space-y-4">
                        {filteredApprovals.map(order => (
                            <ApprovalCard
                                key={order.id}
                                order={order}
                                onSelect={() => onSelectOrder(order)}
                                submitterName={getUserName(order.submittedBy)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-sm">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold text-foreground">All caught up!</h3>
                        <p className="mt-1 text-muted-foreground">
                            There are no orders to display in this view.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Approvals;
