import React, { useState, useEffect } from 'react';
import InvoiceTrackingList from './InvoiceTrackingList';
import { invoiceService } from '../../../services/invoiceService';

interface InvoiceHistoryPageProps {
    companyId: string;
}

const InvoiceHistoryPage: React.FC<InvoiceHistoryPageProps> = ({ companyId }) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        if (companyId) {
            setLoading(true);
            try {
                const data = await invoiceService.getInvoices(companyId);
                setInvoices(data || []);
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [companyId]);

    if (loading && invoices.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading history...</div>;
    }

    return (
        <InvoiceTrackingList
            invoices={invoices}
            onRefresh={fetchInvoices}
        />
    );
};

export default InvoiceHistoryPage;
