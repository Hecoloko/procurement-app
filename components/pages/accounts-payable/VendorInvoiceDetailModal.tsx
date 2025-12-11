import React, { useState } from 'react';
import { VendorInvoice } from '../../../types';
import { XMarkIcon, DocumentReportIcon, CreditCardIcon } from '../../Icons';
import RecordPaymentModal from './RecordPaymentModal';
import { supabase } from '../../../supabaseClient';
import { billbackService } from '../../../services/billbackService';

interface VendorInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: VendorInvoice | null;
    companyId: string;
    onUpdate: () => void; // Refresh list
}

const VendorInvoiceDetailModal: React.FC<VendorInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, companyId, onUpdate }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !invoice) return null;

    const handleRecordPayment = async (data: { paymentMethod: string; transactionRef: string; paymentDate: string; receiptUrl?: string }) => {
        console.log("DEBUG: RecordPaymentModal onSave triggered");
        setLoading(true);
        try {
            // 1. Update Invoice Status
            const { error: updateError } = await supabase
                .from('vendor_invoices')
                .update({
                    status: 'Paid',
                    amount_paid: invoice.totalAmount, // Assuming full payment
                    // In a real app we'd track partial payments in a separate table or fields
                })
                .eq('id', invoice.id);

            if (updateError) throw updateError;

            // 2. Trigger Billback Creation
            // This is the CRITICAL STEP: Auto-create billable items
            await billbackService.createBillableItemsFromVendorInvoice(invoice.id);

            alert('Payment recorded and billable items created!');
            onUpdate();
            onClose();
        } catch (err: any) {
            console.error("Error recording payment:", err);
            alert(`Failed to record payment: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold font-heading tracking-tight">Bill {invoice.invoiceNumber}</h2>
                        <p className="text-sm text-muted-foreground">{invoice.vendorName}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status Banner */}
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${invoice.status === 'Paid' ? 'bg-green-50 border-green-200 text-green-800' :
                        invoice.status === 'Approved' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                            'bg-gray-50 border-gray-200 text-gray-800'
                        }`}>
                        <DocumentReportIcon className="w-6 h-6" />
                        <div>
                            <p className="font-bold text-sm uppercase tracking-wide">Status</p>
                            <p className="text-lg font-bold">{invoice.status}</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Bill Date</p>
                            <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                            <p className="font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
                            <p className="font-bold text-xl">${invoice.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Po Reference</p>
                            <p className="font-mono text-sm">{invoice.purchaseOrderId ? `PO-${invoice.purchaseOrderId.slice(0, 8)}` : 'N/A'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-border flex justify-end gap-3">
                        {invoice.status !== 'Paid' && (
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                            >
                                <CreditCardIcon className="w-5 h-5" />
                                Record Payment
                            </button>
                        )}
                        {invoice.pdfUrl && (
                            <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-2.5 rounded-xl border border-input hover:bg-accent transition-colors font-medium"
                            >
                                View PDF
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={handleRecordPayment}
                amountDue={invoice.totalAmount}
                vendorName={invoice.vendorName || 'Vendor'}
                companyId={companyId}
            />
        </div>
    );
};

export default VendorInvoiceDetailModal;
