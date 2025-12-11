import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../../../types';
import { invoiceService } from '../../../services/invoiceService';
import { PlusIcon, SearchIcon, ChevronRightIcon, CreditCardIcon } from '../../Icons';
import InvoicePaymentModal from './InvoicePaymentModal';

interface InvoiceListProps {
    currentCompanyId: string;
    onCreateInvoice: () => void; // Callback to switch view if not using router
}

const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
        case 'Overdue': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
        case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const InvoiceList: React.FC<InvoiceListProps> = ({ currentCompanyId, onCreateInvoice }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [identifyingPayment, setIdentifyingPayment] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Overdue'>('All');

    useEffect(() => {
        loadInvoices();
    }, [currentCompanyId]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await invoiceService.getInvoices(currentCompanyId);
            setInvoices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentComplete = () => {
        setIdentifyingPayment(null);
        loadInvoices();
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'Unpaid') matchesStatus = inv.status !== 'Paid' && inv.status !== 'Void';
        if (statusFilter === 'Overdue') matchesStatus = inv.status === 'Overdue';

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Manage outbound invoices and track payments.</p>
                </div>
                <button onClick={onCreateInvoice} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg hover:opacity-90 transition-all">
                    <PlusIcon className="w-5 h-5" /> Create Invoice
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Filters */}
                <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                    <button onClick={() => setStatusFilter('All')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${statusFilter === 'All' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>All</button>
                    <button onClick={() => setStatusFilter('Unpaid')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${statusFilter === 'Unpaid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Unpaid</button>
                    <button onClick={() => setStatusFilter('Overdue')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${statusFilter === 'Overdue' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Overdue</button>
                </div>

                <div className="bg-card rounded-lg border border-border p-1 flex-1 shadow-sm max-w-md">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-1.5 bg-background border-none rounded-lg focus:ring-0 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading invoices...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices found.</td></tr>
                            ) : (
                                filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">{inv.customer?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{inv.issueDate}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{inv.dueDate}</td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">${inv.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            {inv.status !== 'Paid' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIdentifyingPayment(inv); }}
                                                    className="p-1 px-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 border border-transparent hover:border-green-200 transition-all"
                                                    title="Collect Payment"
                                                >
                                                    <CreditCardIcon className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Pay</span>
                                                </button>
                                            )}
                                            <button className="text-muted-foreground hover:text-primary transition-colors">
                                                <ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {identifyingPayment && (
                <InvoicePaymentModal
                    invoice={identifyingPayment}
                    onClose={() => setIdentifyingPayment(null)}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
};

export default InvoiceList;
