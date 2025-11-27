
import React from 'react';
import { Property, Unit, Order, AdminUser } from '../types';
import { POIcon, UserGroupIcon, BuildingOfficeIcon, TransactionIcon } from './Icons';

interface PropertyStats {
    unitCount: number;
    orderCount: number;
    userCount: number;
    totalSpend: number;
}

interface PropertyCardProps {
    property: Property;
    stats: PropertyStats;
    onSelectProperty: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, stats, onSelectProperty }) => {
    return (
        <div
            onClick={() => onSelectProperty(property)}
            className="bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 flex flex-col overflow-hidden group transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1"
        >
            <div className="relative">
                <img
                    src={`https://picsum.photos/seed/${property.id}/600/400`}
                    alt={`${property.name} building`}
                    className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 font-bold text-2xl text-white tracking-tight drop-shadow-md">{property.name}</h3>
            </div>
            <div className="p-5 flex-grow grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2.5 rounded-full"><BuildingOfficeIcon className="w-5 h-5 text-blue-400"/></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wide">Units</p>
                        <p className="font-bold text-lg text-white">{stats.unitCount}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2.5 rounded-full"><POIcon className="w-5 h-5 text-green-400"/></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wide">Orders</p>
                        <p className="font-bold text-lg text-white">{stats.orderCount}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2.5 rounded-full"><UserGroupIcon className="w-5 h-5 text-purple-400"/></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wide">Users</p>
                        <p className="font-bold text-lg text-white">{stats.userCount}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/20 p-2.5 rounded-full"><TransactionIcon className="w-5 h-5 text-yellow-400"/></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold tracking-wide">Total Spend</p>
                        <p className="font-bold text-lg text-white">${stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PropertiesDashboardProps {
    properties: Property[];
    units: Unit[];
    orders: Order[];
    users: AdminUser[];
    onSelectProperty: (property: Property) => void;
}

const PropertiesDashboard: React.FC<PropertiesDashboardProps> = ({ properties, units, orders, users, onSelectProperty }) => {

    const calculateStats = (propertyId: string): PropertyStats => {
        const propertyUnits = units.filter(u => u.propertyId === propertyId);
        const propertyOrders = orders.filter(o => o.propertyId === propertyId);
        const propertyUsers = users.filter(u => u.propertyIds.includes(propertyId));
        const totalSpend = propertyOrders.reduce((sum, order) => sum + order.totalCost, 0);

        return {
            unitCount: propertyUnits.length,
            orderCount: propertyOrders.length,
            userCount: propertyUsers.length,
            totalSpend,
        };
    };

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Properties</h1>
            <p className="text-gray-300 mt-2 mb-8">Get a high-level overview of all properties in your portfolio.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map(property => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        stats={calculateStats(property.id)}
                        onSelectProperty={onSelectProperty}
                    />
                ))}
            </div>
        </>
    );
};

export default PropertiesDashboard;
