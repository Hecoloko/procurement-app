
import React, { useState } from 'react';
import { Order, Property, OrderStatus } from '../../types';
import { ChevronRightIcon } from '../Icons';
import MobileOrderDetail from './MobileOrderDetail';

interface MobileOrdersProps {
    orders: Order[];
    properties: Property[];
}

const getStatusTheme = (status: OrderStatus) => {
    const themes: { [key in OrderStatus]?: string } = {
        'Pending My Approval': 'bg-yellow-400/20 text-yellow-300',
        'Approved': 'bg-emerald-400/20 text-emerald-300',
        'Shipped': 'bg-cyan-400/20 text-cyan-300',
        'Completed': 'bg-gray-400/20 text-gray-300',
        'Rejected': 'bg-red-400/20 text-red-300',
        'Processing': 'bg-indigo-400/20 text-indigo-300',
        'Submitted': 'bg-blue-400/20 text-blue-300',
    };
    return themes[status] || 'bg-gray-700 text-gray-300';
};

const MobileOrders: React.FC<MobileOrdersProps> = ({ orders, properties }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const sortedOrders = [...orders].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

    if (selectedOrder) {
        return <MobileOrderDetail order={selectedOrder} properties={properties} onBack={() => setSelectedOrder(null)} />
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Orders</h1>
            <div className="space-y-3">
                {sortedOrders.map(order => (
                    <button key={order.id} onClick={() => setSelectedOrder(order)} className="w-full text-left bg-[#1E1E1E] p-4 rounded-xl shadow-lg border border-gray-800 flex justify-between items-center transition-transform active:scale-95">
                        <div>
                            <h2 className="font-bold text-white">{order.cartName}</h2>
                            <p className="text-sm text-gray-400 mt-1">{order.submissionDate} &bull; ${order.totalCost.toFixed(2)}</p>
                            <div className="mt-2">
                                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusTheme(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileOrders;
