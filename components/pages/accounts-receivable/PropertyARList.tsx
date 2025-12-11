import React, { useState } from 'react';
import { Property, Unit } from '../../../types';
import { SearchIcon, ChevronRightIcon, BuildingOfficeIcon, ChevronDownIcon, ChevronUpIcon } from '../../Icons';

interface PropertyARListProps {
    properties: Property[];
    units: Unit[];
    onSelectProperty: (propertyId: string) => void;
    onSelectUnit?: (propertyId: string, unitId: string) => void;
}

const PropertyARList: React.FC<PropertyARListProps> = ({ properties, units, onSelectProperty, onSelectUnit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

    const filteredProperties = properties.filter(p => {
        const addressString = p.address ? `${p.address.street} ${p.address.city} ${p.address.state}` : '';
        return (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            addressString.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const toggleExpand = (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedProperties);
        if (newExpanded.has(propertyId)) {
            newExpanded.delete(propertyId);
        } else {
            newExpanded.add(propertyId);
        }
        setExpandedProperties(newExpanded);
    };

    const formatAddress = (addr: Property['address']) => {
        if (!addr) return 'No address provided';
        return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Property AR</h1>
                    <p className="text-muted-foreground mt-1">Manage accounts receivable for properties and tenants.</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredProperties.length === 0 ? (
                    <div className="text-center p-12 bg-card rounded-xl border border-border text-muted-foreground">
                        No properties found matching your search.
                    </div>
                ) : (
                    filteredProperties.map(property => {
                        const propertyUnits = units.filter(u => u.propertyId === property.id);
                        const isExpanded = expandedProperties.has(property.id);

                        return (
                            <div key={property.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
                                {/* Property Header Card */}
                                <div
                                    className="p-6 flex items-center justify-between cursor-pointer group hover:bg-muted/10 transition-colors"
                                    onClick={() => onSelectProperty(property.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <BuildingOfficeIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{property.name}</h3>
                                            <p className="text-sm text-muted-foreground">{formatAddress(property.address)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium px-3 py-1 bg-muted rounded-full">
                                            {propertyUnits.length} Units
                                        </span>
                                        <button
                                            onClick={(e) => toggleExpand(e, property.id)}
                                            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                                        </button>
                                        <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shadow-sm">
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Units List (Collapsible) */}
                                {isExpanded && (
                                    <div className="border-t border-border bg-muted/20 p-4 animate-in slide-in-from-top-2 duration-200">
                                        {propertyUnits.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {propertyUnits.map(unit => (
                                                    <div
                                                        key={unit.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onSelectUnit) onSelectUnit(property.id, unit.id);
                                                        }}
                                                        className="bg-background p-4 rounded-lg border border-border hover:border-primary hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                                                    >
                                                        <div>
                                                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{unit.name}</div>
                                                            <div className="text-xs text-muted-foreground">Unit ID: {unit.id.slice(0, 8)}</div>
                                                        </div>
                                                        <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted-foreground text-sm italic">
                                                No units listed for this property.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PropertyARList;
