import React from 'react';
import { Property, Unit, Order, AdminUser } from '../types';
import { ChevronLeftIcon, POIcon, UserGroupIcon, BuildingOfficeIcon, TransactionIcon, ChevronRightIcon } from './Icons';

interface PropertyDetailProps {
    property: Property;
    units: Unit[];
    orders: Order[];
    users: AdminUser[];
    onBack: () => void;
    onSelectOrder: (order: Order) => void;
}

const StatCard: React.FC<{ icon: React.FC<any>, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => {
    const themes: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    }
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${themes[color] || 'bg-gray-100'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};


const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, units, orders, users, onBack, onSelectOrder }) => {

    const totalSpend = orders.reduce((sum, order) => sum + order.totalCost, 0);
    const recentOrders = [...orders].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()).slice(0, 5);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back to all properties
                </button>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{property.name}</h1>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard icon={BuildingOfficeIcon} label="Units" value={units.length} color="blue" />
                <StatCard icon={POIcon} label="Total Orders" value={orders.length} color="green" />
                <StatCard icon={UserGroupIcon} label="Assigned Users" value={users.length} color="purple" />
                <StatCard icon={TransactionIcon} label="Total Spend" value={`$${totalSpend.toLocaleString('en-US')}`} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Units & Users */}
                <div className="space-y-8">
                    {/* Units */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Units</h2>
                        <div className="max-h-60 overflow-y-auto pr-2">
                             {units.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {units.map(unit => (
                                        <li key={unit.id} className="py-2.5 font-medium text-gray-800">{unit.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-8 text-gray-500">No units found.</p>
                            )}
                        </div>
                    </div>

                    {/* Users */}
                     <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Assigned Users</h2>
                         <div className="max-h-60 overflow-y-auto pr-2">
                            {users.length > 0 ? (
                                <ul className="space-y-3">
                                    {users.map(user => (
                                        <li key={user.id} className="flex items-center gap-3">
                                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full"/>
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-8 text-gray-500">No users assigned.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                 <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Orders</h2>
                     <div className="overflow-x-auto">
                        {recentOrders.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="pb-3 text-left font-semibold">Order</th>
                                        <th className="pb-3 text-left font-semibold">Date</th>
                                        <th className="pb-3 text-right font-semibold">Total</th>
                                        <th className="pb-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order.id} onClick={() => onSelectOrder(order)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                                            <td className="py-3 font-semibold text-gray-800">{order.cartName}</td>
                                            <td className="py-3 text-gray-600">{order.submissionDate}</td>
                                            <td className="py-3 text-right font-semibold">${order.totalCost.toFixed(2)}</td>
                                            <td className="py-3 text-right"><ChevronRightIcon className="w-5 h-5 text-gray-400"/></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center py-12 text-gray-500">No recent orders for this property.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
