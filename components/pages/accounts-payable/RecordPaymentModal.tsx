import React, { useState } from 'react';
import { XMarkIcon, CreditCardIcon, BuildingOfficeIcon, LockClosedIcon, ClipboardDocumentIcon } from '../../Icons';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { paymentMethod: string; transactionRef: string; paymentDate: string; receiptUrl?: string }) => void;
    amountDue: number;
    vendorName: string;
    companyId?: string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSave, amountDue, vendorName }) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Check');
    const [transactionRef, setTransactionRef] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate a brief delay or just process immediately
        // In a real app, you might validate more here

        onSave({
            paymentMethod,
            transactionRef,
            paymentDate
        });

        setLoading(false);
        // onClose() is called by parent after onSave success usually, or we can close here?
        // Looking at VendorInvoiceDetailModal, onSave triggers API then onClose. 
        // But better to let parent control closure or auto-close? 
        // Actually VendorInvoiceDetailModal does: await ... onUpdate(); onClose();
        // So we don't need to call onClose() here if onSave is async, but onSave prop definition is void.
        // Wait, VendorInvoiceDetailModal implementation:
        // const handleRecordPayment = async (...) => { ... await ... onClose(); }
        // So we just call onSave.
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold font-heading">Record Payment</h3>
                        <p className="text-sm text-muted-foreground">To {vendorName}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Amount Banner */}
                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <span className="text-primary font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-foreground overflow-hidden text-ellipsis ml-2">
                            ${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Date</label>
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="Check">Check</option>
                                <option value="ACH">ACH Transfer</option>
                                <option value="Wire">Wire Transfer</option>
                                <option value="Credit Card">Credit Card (External)</option>
                                <option value="Cash">Cash</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reference Number (Optional)</label>
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="e.g. Check #1234 or Trans ID"
                                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input hover:bg-accent transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Mark as Paid'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
