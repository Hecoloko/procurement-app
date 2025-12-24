import React, { useState, useMemo } from 'react';
import { SearchIcon, PaperClipIcon } from './Icons';
import { Order, PurchaseOrder, Vendor } from '../types';
import RecordPaymentModal from './pages/accounts-payable/RecordPaymentModal';

interface TransactionsProps {
    orders: Order[];
    vendors: Vendor[];
    onUpdatePoPaymentStatus: (orderId: string, poId: string, updates: Partial<PurchaseOrder> & { paymentMetadata?: any }) => Promise<void>;
}

const Transactions: React.FC<TransactionsProps> = ({ orders, vendors, onUpdatePoPaymentStatus }) => {
    // Option A: Simplified to just 'Active' (needs action) or 'History' (done)
    const [view, setView] = useState<'Active' | 'History'>('Active');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPo, setSelectedPo] = useState<{ orderId: string, po: PurchaseOrder, vendorName: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Invoice' | 'Payment'>('Invoice');

    // Form State (Invoice)
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [amountDue, setAmountDue] = useState<number>(0);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

    const allPurchaseOrders = useMemo(() => {
        const pos: { orderId: string, po: PurchaseOrder, vendorName: string }[] = [];
        orders.forEach(order => {
            if (order.purchaseOrders) {
                order.purchaseOrders.forEach(po => {
                    const vendor = vendors?.find(v => v.id === po.vendorId);
                    // Filter out canceled POs if necessary, but assuming we want to see everything
                    pos.push({
                        orderId: order.id,
                        po,
                        vendorName: vendor?.name || 'Unknown Vendor'
                    });
                });
            }
        });
        return pos;
    }, [orders, vendors]);

    const filteredPos = useMemo(() => {
        let filtered = allPurchaseOrders;

        if (view === 'Active') {
            // Active means anything NOT fully paid. 
            // This includes: Unbilled (needs invoice), Billed (needs payment)
            filtered = filtered.filter(item => item.po.paymentStatus !== 'Paid');
        } else if (view === 'History') {
            // History means fully paid
            filtered = filtered.filter(item => item.po.paymentStatus === 'Paid');
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.vendorName.toLowerCase().includes(lower) ||
                item.po.id.toLowerCase().includes(lower) ||
                (item.po.invoiceNumber && item.po.invoiceNumber.toLowerCase().includes(lower))
            );
        }
        return filtered;
    }, [allPurchaseOrders, view, searchTerm]);

    const handleOpenInvoiceModal = (item: { orderId: string, po: PurchaseOrder, vendorName: string }) => {
        setSelectedPo(item);
        setModalType('Invoice');
        setInvoiceNumber('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        const next30 = new Date();
        next30.setDate(next30.getDate() + 30);
        setDueDate(next30.toISOString().split('T')[0]);
        setInvoiceFile(null);
        const total = (item.po.items || []).reduce((sum, i) => sum + (i.totalPrice || 0), 0);
        setAmountDue(total);
        setIsModalOpen(true);
    };

    const handleOpenPaymentModal = (item: { orderId: string, po: PurchaseOrder, vendorName: string }) => {
        setSelectedPo(item);
        setModalType('Payment');
        setIsModalOpen(true);
    };

    const handleSubmitInvoice = async () => {
        if (!selectedPo) return;

        await onUpdatePoPaymentStatus(selectedPo.orderId, selectedPo.po.id, {
            paymentStatus: 'Billed',
            invoiceNumber,
            invoiceDate,
            dueDate,
            amountDue,
            invoiceUrl: invoiceFile ? URL.createObjectURL(invoiceFile) : undefined
        });
        setIsModalOpen(false);
    };

    const handleRecordPayment = async (data: { paymentMethod: string; transactionRef: string; paymentDate: string; receiptUrl?: string }) => {
        if (!selectedPo) return;

        console.log("Recording Payment:", data);

        // Append Ref to Method for visibility in History (since we lack a transaction_ref column)
        const methodWithRef = data.transactionRef ? `${data.paymentMethod} (Ref: ${data.transactionRef})` : data.paymentMethod;

        try {
            await onUpdatePoPaymentStatus(selectedPo.orderId, selectedPo.po.id, {
                paymentStatus: 'Paid',
                paymentDate: data.paymentDate,
                paymentMethod: methodWithRef,
                amountDue: 0,
                // Do NOT set processPayment: true here, as this is a manual record
                paymentMetadata: { ref: data.transactionRef, method: data.paymentMethod, recordedManual: true }
            });
            alert("Payment Recorded Successfully!");
            setIsModalOpen(false);
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    // Helper to determine the primary action button for a row
    const renderActionButton = (item: { orderId: string, po: PurchaseOrder, vendorName: string }) => {
        if (view === 'History') {
            return <span className="text-muted-foreground text-xs font-medium px-2 py-1 bg-muted rounded">Paid & Closed</span>;
        }

        const status = item.po.paymentStatus || 'Unbilled';

        if (status === 'Unbilled') {
            return (
                <button
                    onClick={() => handleOpenInvoiceModal(item)}
                    className="text-primary hover:text-primary/80 font-medium text-xs bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors border border-primary/20"
                >
                    Receive Invoice
                </button>
            );
        } else if (status === 'Billed') {
            return (
                <button
                    onClick={() => handleOpenPaymentModal(item)}
                    className="text-green-600 hover:text-green-700 font-medium text-xs bg-green-100 dark:bg-green-900/30 hover:dark:bg-green-900/50 px-3 py-1.5 rounded-md transition-colors border border-green-200 dark:border-green-800"
                >
                    Pay Bill
                </button>
            );
        }

        return <span className="text-muted-foreground text-xs">{status}</span>;
    };

    return (
        <div className="animate-fade-in p-6">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Transactions</h1>
                <p className="text-muted-foreground mt-2">Manage invoices and payments.</p>
            </div>

            {/* View Selectors - Simplified 2 Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setView('Active')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${view === 'Active' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Bills (Active)
                    </button>
                    <button
                        onClick={() => setView('History')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${view === 'History' ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        History
                    </button>
                </div>

                <div className="relative flex-1 md:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-muted-foreground" /></div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-colors" placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">PO Number</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredPos.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                {view === 'Active' ? 'No active bills! You are all caught up.' : 'No payment history found.'}
                            </td></tr>
                        ) : (
                            filteredPos.map((item) => {
                                const total = item.po.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
                                const status = item.po.paymentStatus || 'Unbilled';

                                return (
                                    <tr key={item.po.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">{item.vendorName}</td>
                                        <td className="px-6 py-4 font-mono text-muted-foreground">{item.po.id}</td>
                                        <td className="px-6 py-4 text-foreground">
                                            {status === 'Unbilled' ? (
                                                <span className="text-muted-foreground italic">Pending Invoice</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {item.po.invoiceDate || 'N/A'}
                                                    {item.po.invoiceUrl && <a href={item.po.invoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary hover:text-primary/80 transition-colors opacity-50 group-hover:opacity-100"><PaperClipIcon className="w-4 h-4" /></a>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            ${(item.po.amountDue || total).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border 
                                                ${status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:border-green-800' :
                                                    status === 'Billed' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' :
                                                        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800'}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {renderActionButton(item)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invoice Modal */}
            {isModalOpen && selectedPo && modalType === 'Invoice' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h2 className="text-xl font-bold text-foreground">Receive Invoice</h2>
                            <p className="text-sm text-muted-foreground mt-1">{selectedPo.vendorName} - PO #{selectedPo.po.id}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-foreground mb-1">Invoice Number</label><input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-12345" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-foreground mb-1">Invoice Date</label><input type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
                                <div><label className="block text-sm font-medium text-foreground mb-1">Due Date</label><input type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-foreground mb-1">Amount Due</label><input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={amountDue} onChange={(e) => setAmountDue(parseFloat(e.target.value))} /></div>
                            <div><label className="block text-sm font-medium text-foreground mb-1">Upload Invoice</label><input type="file" className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" onChange={(e) => e.target.files && setInvoiceFile(e.target.files[0])} /></div>
                        </div>
                        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSubmitInvoice} className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-sm hover:shadow active:scale-95 transition-all">Save Bill</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Online Payment Modal */}
            {isModalOpen && selectedPo && modalType === 'Payment' && (
                <RecordPaymentModal
                    isOpen={true}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleRecordPayment}
                    amountDue={selectedPo.po.amountDue || 0}
                    vendorName={selectedPo.vendorName}
                />
            )}
        </div>
    );
};

export default Transactions;
