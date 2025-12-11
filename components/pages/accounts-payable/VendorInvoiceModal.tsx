import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Company, Vendor, VendorInvoice, PurchaseOrder } from '../../../types';
import { XMarkIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from '../../Icons';

interface VendorInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    companyId: string;
    existingInvoice?: VendorInvoice;
}

// Simple type for line items in the form
interface FormLineItem {
    id: string; // temp id or real id
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    purchase_order_id?: string;
}

const VendorInvoiceModal: React.FC<VendorInvoiceModalProps> = ({ isOpen, onClose, onSave, companyId, existingInvoice }) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [vendorId, setVendorId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState<FormLineItem[]>([]);
    const [selectedPoId, setSelectedPoId] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchVendors();
            if (existingInvoice) {
                // Populate form
                setVendorId(existingInvoice.vendorId);
                setInvoiceNumber(existingInvoice.invoiceNumber);
                setInvoiceDate(existingInvoice.invoiceDate.split('T')[0]);
                setDueDate(existingInvoice.dueDate ? existingInvoice.dueDate.split('T')[0] : '');
                // TODO: Fetch items if editing
            } else {
                // Reset form
                setVendorId('');
                setInvoiceNumber('');
                setInvoiceDate(new Date().toISOString().split('T')[0]);
                setDueDate('');
                setItems([]);
                setSelectedPoId('');
            }
        }
    }, [isOpen, existingInvoice]);

    useEffect(() => {
        if (vendorId) {
            fetchOpenPOs(vendorId);
        } else {
            setPurchaseOrders([]);
        }
    }, [vendorId]);

    const fetchVendors = async () => {
        const { data } = await supabase.from('vendors').select('*').eq('company_id', companyId);
        if (data) setVendors(data as any);
    };

    const fetchOpenPOs = async (vId: string) => {
        // Fetch open POs for this vendor
        const { data } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('vendor_id', vId)
            .neq('status', 'Closed') // Assuming 'Closed' means fully billed
            .order('created_at', { ascending: false });

        if (data) setPurchaseOrders(data as any);
    };

    const handleAddItem = () => {
        setItems([...items, {
            id: `temp-${Date.now()}`,
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0
        }]);
    };

    const handleUpdateItem = (index: number, field: keyof FormLineItem, value: any) => {
        const newItems = [...items];
        let val = value;
        if (field === 'quantity' || field === 'unit_price') {
            val = parseFloat(value) || 0;
        }
        const item = { ...newItems[index], [field]: val };

        // Recalculate total
        if (field === 'quantity' || field === 'unit_price') {
            item.total = Number(item.quantity) * Number(item.unit_price);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleLinkPO = (poId: string) => {
        setSelectedPoId(poId);
        // Logic to pull items from PO could go here
        // For now just setting the ID
    };

    const handleSubmit = async () => {
        console.log("handleSubmit called. Data:", { vendorId, invoiceNumber, invoiceDate, items });

        if (!vendorId) { alert("Please select a vendor"); return; }
        if (!invoiceNumber) { alert("Please enter a bill number"); return; }
        if (!invoiceDate) { alert("Please enter a bill date"); return; }

        setLoading(true);
        try {
            const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
            console.log("Calculated Total:", totalAmount);

            // 1. Create Invoice
            const invoicePayload = {
                company_id: companyId,
                vendor_id: vendorId,
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate,
                due_date: dueDate || null,
                total_amount: totalAmount,
                status: 'Draft', // Ensure this matches DB enum/text
                purchase_order_id: selectedPoId || null
            };
            console.log("Invoice Payload:", invoicePayload);

            const { data: invData, error: invError } = await supabase
                .from('vendor_invoices')
                .insert(invoicePayload)
                .select()
                .single();

            if (invError) {
                console.error("Supabase Invoice Insert Error:", invError);
                throw invError;
            }
            console.log("Invoice Created:", invData);

            // 2. Create Items
            if (items.length > 0) {
                const itemsPayload = items.map(item => ({
                    invoice_id: invData.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total
                }));
                console.log("Items Payload:", itemsPayload);

                const { error: itemsError } = await supabase
                    .from('vendor_invoice_items')
                    .insert(itemsPayload);

                if (itemsError) {
                    console.error("Supabase Items Insert Error:", itemsError);
                    throw itemsError;
                }
                console.log("Items Created");
            }

            console.log("Success! Closing modal.");
            onSave();
            onClose();
        } catch (err: any) {
            console.error('Error saving invoice:', err);
            alert('Failed to save invoice: ' + (err.message || JSON.stringify(err)));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-xl font-bold font-heading tracking-tight">
                        {existingInvoice ? 'Edit Bill' : 'New Bill'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Vendor</label>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                                disabled={!!existingInvoice}
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Reference PO (Optional)</label>
                            <select
                                value={selectedPoId}
                                onChange={(e) => handleLinkPO(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                            >
                                <option value="">No PO Linked</option>
                                {purchaseOrders.map(po => (
                                    <option key={po.id} value={po.id}>PO #{po.id.slice(0, 8)}... - {po.created_at ? new Date(po.created_at).toLocaleDateString() : 'No Date'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bill Number</label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                                placeholder="e.g. INV-2023-001"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Bill Date</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-input bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-input bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Line Items</h3>
                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-3 w-1/2">Description</th>
                                        <th className="p-3 w-24">Qty</th>
                                        <th className="p-3 w-32">Unit Price</th>
                                        <th className="p-3 w-32 text-right">Total</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">
                                                No items. Add items manually or import from PO.
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="group hover:bg-accent/5">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                                    className="w-full p-1 bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground/50"
                                                    placeholder="Item description"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full p-1 bg-transparent border-none focus:ring-0"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full p-1 bg-transparent border-none focus:ring-0"
                                                />
                                            </td>
                                            <td className="p-3 text-right font-mono text-sm">
                                                ${item.total.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteItem(idx)}
                                                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/30 border-t border-border font-semibold">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right">Total Due:</td>
                                        <td className="p-3 text-right">
                                            ${items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-input hover:bg-accent transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorInvoiceModal;
