import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { VendorInvoice, Company, Vendor } from '../../../types';
import { PlusIcon, RefreshIcon, SearchIcon, FilterIcon, DocumentReportIcon } from '../../Icons';

import VendorInvoiceModal from './VendorInvoiceModal';

interface VendorInvoicesListProps {
    companyId: string;
    onViewDetail: (invoice: VendorInvoice) => void;
}

const VendorInvoicesList: React.FC<VendorInvoicesListProps> = ({ companyId, onViewDetail }) => {
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Join with vendors to get vendor name
            const { data, error } = await supabase
                .from('vendor_invoices')
                .select(`
                    *,
                    vendors:vendor_id (name)
                `)
                .eq('company_id', companyId)
                .order('invoice_date', { ascending: false });

            if (error) throw error;

            const mappedInvoices: VendorInvoice[] = (data || []).map((inv: any) => ({
                id: inv.id,
                companyId: inv.company_id,
                vendorId: inv.vendor_id,
                vendorName: inv.vendors?.name || 'Unknown Vendor',
                purchaseOrderId: inv.purchase_order_id,
                invoiceNumber: inv.invoice_number,
                invoiceDate: inv.invoice_date,
                dueDate: inv.due_date,
                totalAmount: inv.total_amount,
                status: inv.status,
                approvalStatus: inv.approval_status,
                pdfUrl: inv.pdf_url
            }));

            setInvoices(mappedInvoices);
        } catch (err: any) {
            console.error('Error fetching vendor invoices:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchInvoices();
        }
    }, [companyId]);

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Approved': return 'bg-blue-100 text-blue-800';
            case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Void': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Bills (Vendor Invoices)</h1>
                    <p className="text-muted-foreground mt-1">Manage and pay your vendor invoices.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchInvoices}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border bg-card"
                        title="Refresh"
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Enter Bill
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by vendor or invoice #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <FilterIcon className="w-5 h-5 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Status</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Vendor</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Bill #</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Date</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap">Due Date</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap text-right">Amount</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground whitespace-nowrap text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        Loading bills...
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <DocumentReportIcon className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-lg font-medium text-foreground">No bills found</p>
                                            <p className="text-sm">Create a new bill to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="hover:bg-accent/50 transition-colors group cursor-pointer"
                                        onClick={() => onViewDetail(inv)}
                                    >
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-foreground">{inv.vendorName}</td>
                                        <td className="p-4 text-muted-foreground">{inv.invoiceNumber}</td>
                                        <td className="p-4 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                        <td className="p-4 text-muted-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                                        <td className="p-4 text-right font-medium text-foreground">
                                            ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                className="text-primary hover:text-primary/80 text-sm font-medium px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetail(inv);
                                                }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <VendorInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={fetchInvoices}
                companyId={companyId}
            />
        </div>
    );
};

export default VendorInvoicesList;
