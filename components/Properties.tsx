import React, { useState } from 'react';
import { Property, Unit, Order, AdminUser } from '../types';
import PropertiesDashboard from './PropertiesDashboard';
import PropertyDetail from './PropertyDetail';

interface PropertiesProps {
    properties: Property[];
    units: Unit[];
    orders: Order[];
    users: AdminUser[];
    onSelectOrder: (order: Order) => void;
}

const Properties: React.FC<PropertiesProps> = ({ properties, units, orders, users, onSelectOrder }) => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'detail'>('dashboard');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const handleSelectProperty = (property: Property) => {
        setSelectedProperty(property);
        setViewMode('detail');
    };

    const handleBackToDashboard = () => {
        setSelectedProperty(null);
        setViewMode('dashboard');
    };

    if (viewMode === 'detail' && selectedProperty) {
        return (
            <PropertyDetail
                property={selectedProperty}
                units={units.filter(u => u.propertyId === selectedProperty.id)}
                orders={orders.filter(o => o.propertyId === selectedProperty.id)}
                users={users.filter(u => u.propertyIds.includes(selectedProperty.id))}
                onBack={handleBackToDashboard}
                onSelectOrder={onSelectOrder}
            />
        );
    }
    
    return (
        <PropertiesDashboard
            properties={properties}
            units={units}
            orders={orders}
            users={users}
            onSelectProperty={handleSelectProperty}
        />
    );
};

export default Properties;
