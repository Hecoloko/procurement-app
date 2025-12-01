
import React, { useState } from 'react';
import { Order, Property, OrderStatus } from '../../types';
import { ChevronRightIcon, POIcon } from '../Icons';
import MobileOrderDetail from './MobileOrderDetail';

interface MobileOrdersProps {
    orders: Order[];
    properties: Property[];
    onProcure?: (order: Order) => void;
}

const getStatusTheme = (status: OrderStatus) => {
    const themes: { [key in OrderStatus]?: string } = {
        'Pending My Approval': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-emerald-100 text-emerald-800',
        'Shipped': 'bg-cyan-100 text-cyan-800',
        'Completed': 'bg-gray-100 text-gray-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Processing': 'bg-indigo-100 text-indigo-800',
        'Submitted': 'bg-blue-100 text-blue-800',
    };
    return themes[status] || 'bg-gray-100 text-gray-800';
};

const MobileOrders: React.FC<MobileOrdersProps> = ({ orders, properties, onProcure }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const sortedOrders = [...orders].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

    if (selectedOrder) {
        return <MobileOrderDetail
            order={selectedOrder}
            properties={properties}
            onBack={() => setSelectedOrder(null)}
            onProcure={onProcure}
        />
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>
            <div className="space-y-3">
                {sortedOrders.map(order => (
                    <button key={order.id} onClick={() => setSelectedOrder(order)} className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center transition-all active:scale-[0.98] hover:shadow-md">
                        <div>
                            <h2 className="font-bold text-gray-900">{order.cartName}</h2>
                            <p className="text-sm text-gray-500 mt-1">{order.submissionDate} &bull; ${order.totalCost.toFixed(2)}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusTheme(order.status)}`}>
                                    {order.status}
                                </span>
                                {order.status === 'Approved' && onProcure && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                        <POIcon className="w-3 h-3" /> Ready to Procure
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileOrders;
