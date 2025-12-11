import React, { useState } from 'react';
import InvoiceList from './InvoiceList';
import CreateInvoice from './CreateInvoice';
import BillableItemsList from './BillableItemsList';
import { Product, Customer, BillableItem } from '../../../types';

interface InvoicesPageProps {
    currentCompanyId: string;
    currentUser: any;
    products: Product[];
    customers: Customer[];
    properties: any[];
    units: any[];
}
const InvoicesPage: React.FC<InvoicesPageProps> = ({ currentCompanyId, currentUser, products, customers, properties, units }) => {
    const [view, setView] = useState<'billable' | 'create'>('billable');
    const [selectedBillableItems, setSelectedBillableItems] = useState<BillableItem[]>([]);

    const handleCreateInvoiceFromBillable = (items: BillableItem[]) => {
        setSelectedBillableItems(items);
        setView('create');
    };

    if (view === 'create') {
        return (
            <CreateInvoice
                currentCompanyId={currentCompanyId}
                currentUser={currentUser}
                products={products}
                customers={customers}
                properties={properties || []}
                units={units || []}
                initialBillableItems={selectedBillableItems}
                onBack={() => {
                    setView('billable');
                    setSelectedBillableItems([]);
                }}
                onSaveSuccess={() => {
                    setView('billable');
                    setSelectedBillableItems([]);
                }}
            />
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <BillableItemsList
                companyId={currentCompanyId}
                customers={customers}
                properties={properties || []}
                units={units || []}
                onCreateInvoice={handleCreateInvoiceFromBillable}
            />
        </div>
    );
};

export default InvoicesPage;
