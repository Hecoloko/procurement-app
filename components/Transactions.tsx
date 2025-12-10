import React, { useState, useMemo } from 'react';
import { SearchIcon, PaperClipIcon } from './Icons';
import { Order, PurchaseOrder, Vendor } from '../types';
import ProcessPaymentModal from './ProcessPaymentModal';

interface TransactionsProps {
    orders: Order[];
    vendors: Vendor[];
    onUpdatePoPaymentStatus: (orderId: string, poId: string, updates: Partial<PurchaseOrder> & { paymentMetadata?: any }) => Promise<void>;
}

const Transactions: React.FC<TransactionsProps> = ({ orders, vendors, onUpdatePoPaymentStatus }) => {
    const [view, setView] = useState<'Bills' | 'Payments' | 'History'>('Bills');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPo, setSelectedPo] = useState<{ orderId: string, po: PurchaseOrder, vendorName: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Invoice' | 'Payment' | 'ProcessPayment'>('Invoice');

    // Form State (Invoice)
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [amountDue, setAmountDue] = useState<number>(0);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

    // Form State (Legacy Manual Payment Record)
    const [paymentMethod, setPaymentMethod] = useState('ACH');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const allPurchaseOrders = useMemo(() => {
        // ... (existing logic)
        const pos: { orderId: string, po: PurchaseOrder, vendorName: string }[] = [];
        orders.forEach(order => {
            if (order.purchaseOrders) {
                order.purchaseOrders.forEach(po => {
                    const vendor = vendors?.find(v => v.id === po.vendorId);
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
        // ... (existing logic)
        let filtered = allPurchaseOrders;

        if (view === 'Bills') {
            filtered = filtered.filter(item =>
                item.po.status === 'Received' &&
                (!item.po.paymentStatus || item.po.paymentStatus === 'Unbilled')
            );
        } else if (view === 'Payments') {
            filtered = filtered.filter(item => item.po.paymentStatus === 'Billed');
        } else if (view === 'History') {
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
        setModalType('ProcessPayment'); // Use the new Modal
        setIsModalOpen(false); // Close generic, render specific below or manage state
    };

    // Wrapper for legacy modal (if needed later) or just redirect logic?
    // Let's keep isModalOpen for the generic Invoice modal, and a separate conditional for payment?
    // Or reuse isModalOpen.

    const handleProcessPayment = async (paymentData: any) => {
        if (!selectedPo) return;

        console.log("Processing Payment with Data:", paymentData);
        // Pass the payment data (settingsId, cardDetails) up to the parent handler
        // The parent (App.tsx) will call paymentService.processPayment
        const totalAmount = selectedPo.po.amountDue || (selectedPo.po.items || []).reduce((sum, i) => sum + (i.totalPrice || 0), 0);

        await onUpdatePoPaymentStatus(selectedPo.orderId, selectedPo.po.id, {
            paymentStatus: 'Paid',
            paymentDate: new Date().toISOString(),
            paymentMethod: 'Credit Card (Sola)',
            amountDue: totalAmount, // Critical for payment processing
            paymentMetadata: paymentData // Pass this through!
        });

        setSelectedPo(null);
        setModalType('Invoice'); // Reset
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

    return (
        <div className="animate-fade-in p-6">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Transactions</h1>
                <p className="text-muted-foreground mt-2">Manage invoices and payments.</p>
            </div>

            {/* View Selectors */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                    <button onClick={() => setView('Bills')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${view === 'Bills' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Bills to Pay</button>
                    <button onClick={() => setView('Payments')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${view === 'Payments' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Ready for Payment</button>
                    <button onClick={() => setView('History')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${view === 'History' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>History</button>
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
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No transactions found.</td></tr>
                        ) : (
                            filteredPos.map((item) => {
                                const total = item.po.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
                                return (
                                    <tr key={item.po.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{item.vendorName}</td>
                                        <td className="px-6 py-4 font-mono text-muted-foreground">{item.po.id}</td>
                                        <td className="px-6 py-4 text-foreground">
                                            {view === 'Bills' ? 'Received' : item.po.invoiceDate || 'N/A'}
                                            {item.po.invoiceUrl && <a href={item.po.invoiceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-block text-primary hover:text-primary/80"><PaperClipIcon className="w-4 h-4" /></a>}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground">${(item.po.amountDue || total).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30' : item.po.paymentStatus === 'Billed' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30' : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30'}`}>
                                                {item.po.paymentStatus || 'Unbilled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {view === 'Bills' && <button onClick={() => handleOpenInvoiceModal(item)} className="text-primary hover:text-primary/80 font-medium text-xs bg-primary/10 px-3 py-1.5 rounded-md transition-colors">Receive Invoice</button>}
                                            {view === 'Payments' && <button onClick={() => { setSelectedPo(item); setModalType('ProcessPayment'); }} className="text-green-600 hover:text-green-700 font-medium text-xs bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-md transition-colors">Pay Bill</button>}
                                            {view === 'History' && <span className="text-muted-foreground text-xs">Completed</span>}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">Receive Invoice</h2>
                            <p className="text-sm text-muted-foreground mt-1">{selectedPo.vendorName} - PO #{selectedPo.po.id}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-foreground mb-1">Invoice Number</label><input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-12345" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-foreground mb-1">Invoice Date</label><input type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
                                <div><label className="block text-sm font-medium text-foreground mb-1">Due Date</label><input type="date" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-foreground mb-1">Amount Due</label><input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={amountDue} onChange={(e) => setAmountDue(parseFloat(e.target.value))} /></div>
                            <div><label className="block text-sm font-medium text-foreground mb-1">Upload Invoice</label><input type="file" className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" onChange={(e) => e.target.files && setInvoiceFile(e.target.files[0])} /></div>
                        </div>
                        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSubmitInvoice} className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:opacity-90">Save Bill</button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Process Payment Modal (Sola Integration) */}
            {selectedPo && modalType === 'ProcessPayment' && (
                <ProcessPaymentModal
                    invoice={{
                        invoice_number: selectedPo.po.invoiceNumber,
                        amount: selectedPo.po.amountDue || 0
                    }}
                    onClose={() => { setSelectedPo(null); setModalType('Invoice'); }}
                    onProcess={handleProcessPayment}
                />
            )}
        </div>
    );
};

export default Transactions;
