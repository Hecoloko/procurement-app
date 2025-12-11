import React, { useState, useEffect } from 'react';
import { Customer, Product, Invoice, InvoiceItem } from '../../../types';
import { customerService } from '../../../services/customerService';
import { invoiceService } from '../../../services/invoiceService';
import { billbackService } from '../../../services/billbackService';
import UnbilledItemsModal from './UnbilledItemsModal';
import { ChevronLeftIcon, PlusIcon, TrashIcon, BriefcaseIcon } from '../../Icons';

import { BillableItem } from '../../../types';

interface CreateInvoiceProps {
    currentCompanyId: string;
    currentUser: any;
    products: Product[];
    customers: Customer[];
    properties: any[];
    units: any[];
    initialBillableItems?: BillableItem[];
    preSelectedPropertyId?: string | null;
    preSelectedUnitId?: string | null;
    onBack: () => void;
    onSaveSuccess: () => void;
}

const CreateInvoice: React.FC<CreateInvoiceProps> = ({ currentCompanyId, currentUser, products, customers, properties, units, initialBillableItems, preSelectedPropertyId, preSelectedUnitId, onBack, onSaveSuccess }) => {
    // Wizard State
    const [viewState, setViewState] = useState<'edit' | 'preview' | 'ordering'>('edit');
    const [emailSubject, setEmailSubject] = useState('Invoice from Company');
    const [emailBody, setEmailBody] = useState('Please find attached your invoice.');

    // Billback State
    const [isBillbackModalOpen, setIsBillbackModalOpen] = useState(false);
    const [importedItemIds, setImportedItemIds] = useState<string[]>([]);

    // Invoice Form State
    const [recipientType, setRecipientType] = useState<'customer' | 'property'>('customer');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');

    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [taxRate, setTaxRate] = useState<number>(8);

    // Auto-select Default Property (Alpha Headquarters) if creating new invoice
    useEffect(() => {
        if (initialBillableItems && initialBillableItems.length > 0) return;

        if (preSelectedPropertyId) {
            setRecipientType('property');
            setSelectedPropertyId(preSelectedPropertyId);
            setSelectedUnitId(preSelectedUnitId || '');
            return;
        }

        if (!selectedPropertyId && properties.length > 0) {
            const defaultProp = properties.find(p => p.name.includes('Alpha Headquarters')) || properties[0];
            if (defaultProp) {
                setRecipientType('property');
                setSelectedPropertyId(defaultProp.id);
            }
        }
    }, [properties, initialBillableItems, preSelectedPropertyId, preSelectedUnitId]);


    // Initialize from billable items
    useEffect(() => {
        if (initialBillableItems && initialBillableItems.length > 0) {
            const firstItem = initialBillableItems[0];

            // Auto-detect recipient type and pre-fill details
            if (firstItem.propertyId && firstItem.unitId) {
                setRecipientType('property');
                setSelectedPropertyId(firstItem.propertyId);
                setSelectedUnitId(firstItem.unitId);
            } else if (firstItem.customerId) {
                setRecipientType('customer');
                setSelectedCustomerId(firstItem.customerId);
            }

            mapAndSetItems(initialBillableItems);
        } else {
            // Default Date Setup if not editing existing items
            setInvoiceDate(new Date().toISOString().split('T')[0]);
        }
    }, [initialBillableItems]);

    const mapAndSetItems = (billableItems: BillableItem[]) => {
        const mappedItems: Partial<InvoiceItem>[] = billableItems.map(bi => ({
            id: `bi-${bi.id}`,
            description: bi.description,
            quantity: 1,
            unitPrice: bi.totalAmount, // Already includes markup
            totalPrice: bi.totalAmount,
            // Track source
            costPrice: bi.costAmount,
            markupPercentage: (bi.markupAmount / bi.costAmount) * 100 // Approximate
        }));
        setItems(prev => [...prev, ...mappedItems]);
        setImportedItemIds(prev => [...prev, ...billableItems.map(i => i.id)]);
    };

    const handleImportItems = (importedItems: BillableItem[]) => {
        mapAndSetItems(importedItems);
    };

    const handleAddItem = () => {
        setItems([...items, { id: `temp-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    };

    const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'unitPrice') {
            const qty = Number(newItems[index].quantity || 0);
            const price = Number(newItems[index].unitPrice || 0);
            newItems[index].totalPrice = qty * price;
        }

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].description = product.name;
                newItems[index].costPrice = product.unitPrice;
                newItems[index].markupPercentage = 20;
                newItems[index].unitPrice = product.unitPrice * 1.20;
                newItems[index].totalPrice = (newItems[index].quantity || 1) * (product.unitPrice * 1.20);
            }
        }
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const taxTotal = subtotal * (taxRate / 100);
        return { subtotal, taxTotal, totalAmount: subtotal + taxTotal };
    };

    const handleSave = async (status: 'Draft' | 'Sent') => {
        if (recipientType === 'customer' && !selectedCustomerId) return alert('Please select a customer');
        if (recipientType === 'property' && (!selectedPropertyId || !selectedUnitId)) return alert('Please select a Property and Unit');

        setLoading(true);
        try {
            const totals = calculateTotals();
            const invoiceData: Partial<Invoice> = {
                companyId: currentCompanyId,
                customerId: recipientType === 'customer' ? selectedCustomerId : undefined,
                propertyId: recipientType === 'property' ? selectedPropertyId : undefined,
                unitId: recipientType === 'property' ? selectedUnitId : undefined,
                invoiceNumber: `INV-${Date.now()}`,
                status,
                issueDate: invoiceDate,
                dueDate: dueDate || undefined,
                subtotal: totals.subtotal,
                taxTotal: totals.taxTotal,
                totalAmount: totals.totalAmount,
                amountPaid: 0,
                notes,
                createdBy: currentUser?.id
            };

            const invoiceResponse = await invoiceService.createInvoice(invoiceData, items);

            // Mark billable items as invoiced
            if (importedItemIds.length > 0 && invoiceResponse?.id) {
                await billbackService.markBillableItemsAsInvoiced(importedItemIds, invoiceResponse.id);
            }

            if (status === 'Sent') {
                const recipientEmail = recipientType === 'customer'
                    ? customers.find(c => c.id === selectedCustomerId)?.email
                    : 'unit-resident@example.com';

                console.log('Sending email:', { to: recipientEmail, subject: emailSubject, body: emailBody });
                alert(`Invoice Sent! Email queued to ${recipientEmail}.`);
            }

            onSaveSuccess();
        } catch (err) {
            console.error('Failed to create invoice:', err);
            alert('Failed to save invoice');
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, taxTotal, totalAmount } = calculateTotals();


    // Auto-generate email when entering preview
    useEffect(() => {
        if (viewState === 'preview') {
            const customer = customers.find(c => c.id === selectedCustomerId);
            const property = properties.find(p => p.id === selectedPropertyId);
            const unit = units.find(u => u.id === selectedUnitId);

            const customerName = recipientType === 'customer' ? (customer?.name || 'Valued Customer') : (property?.name || 'Property Manager');
            const propertyUnitName = recipientType === 'property'
                ? `${property?.name || 'Property'} - ${unit?.name || 'Unit'}`
                : 'your account';

            const invoiceNum = `INV-${Date.now()}`;
            const formattedDate = new Date(invoiceDate).toLocaleDateString();
            const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'Due Upon Receipt';

            // Calculate totals for email
            const currentSubtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const currentTax = currentSubtotal * (taxRate / 100);
            const currentTotal = currentSubtotal + currentTax;

            const template = `Subject: Invoice ${invoiceNum} - Payment Request

Dear ${customerName},

We hope this email finds you well.

Please find attached the invoice for services rendered and items provided at:
${propertyUnitName}

Invoice Summary:
----------------------------------------
Invoice Number: ${invoiceNum}
Issue Date:     ${formattedDate}
Due Date:       ${formattedDueDate}
----------------------------------------

Total Amount Due: $${currentTotal.toFixed(2)}

Please arrange for payment by the due date to ensure continued service.

If you have any questions regarding this invoice, please contact our
Accounts Receivable team at billing@mycompany.com.

Sincerely,

My Company
Accounts Department`;

            setEmailBody(template);
            setEmailSubject(`Invoice ${invoiceNum} - Payment Request`);
        }
    }, [viewState, items, invoiceDate, dueDate, recipientType, selectedCustomerId, selectedPropertyId, selectedUnitId, customers, properties, units, taxRate]);


    // RENDER: PREVIEW MODE
    if (viewState === 'preview') {
        const customer = customers.find(c => c.id === selectedCustomerId);
        const property = properties.find(p => p.id === selectedPropertyId);
        const unit = units.find(u => u.id === selectedUnitId);

        const billToName = recipientType === 'customer' ? (customer?.name || 'Unknown Customer') : `${property?.name || 'Unknown Property'} - ${unit?.name || 'Unit'}`;
        const billToAddress = recipientType === 'customer'
            ? `${customer?.billingAddress?.street || ''}, ${customer?.billingAddress?.city || ''}`
            : `${property?.address?.street || property?.name || ''}`;

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-7xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setViewState('edit')} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-foreground">Review & Send</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Invoice Preview */}
                    <div className="bg-white border rounded-lg shadow-sm p-8 min-h-[600px] text-sm text-gray-900">
                        <div className="flex justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                            <div className="text-right">
                                <p className="font-bold">My Company</p>
                                <p>123 Business Rd</p>
                                <p>Commerce City, CA 90000</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-gray-500 mb-1">Bill To:</p>
                            <p className="font-bold">{billToName}</p>
                            <p>{billToAddress}</p>
                        </div>

                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="text-left py-2 text-gray-600">Description</th>
                                    <th className="text-right py-2 text-gray-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-800">{item.description}</td>
                                        <td className="py-2 text-right text-gray-800">${(item.totalPrice || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end">
                            <div className="w-1/2 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax (8%)</span>
                                    <span className="text-gray-900">${taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <p className="font-bold mb-2 text-gray-800">Payment Methods</p>
                            <p className="text-gray-600">Bank Transfer: Chase Bank</p>
                            <p className="text-gray-600">Routing: 123456789 | Account: 987654321</p>
                        </div>
                    </div>

                    {/* Email Preview */}
                    <div className="bg-card p-6 rounded-xl border border-border space-y-6 h-fit sticky top-6">
                        <h3 className="font-bold text-lg">Email Composer</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">To</label>
                            <input disabled value={customer?.email || 'customer@example.com'} className="w-full p-2 rounded border bg-muted text-muted-foreground" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full p-2 rounded border bg-background text-foreground" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Message</label>
                            <textarea rows={15} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full p-2 rounded border bg-background text-foreground font-mono text-sm" />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button onClick={onBack} className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors">Cancel</button>
                            <button onClick={() => handleSave('Sent')} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:shadow-lg transition-all">
                                {loading ? 'Sending...' : 'Confirm & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: EDIT MODE (Default)
    return (
        <div className="animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-foreground">New Invoice</h1>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 space-y-8">

                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {/* Recipient Toggle - Only show if manually editing or empty */}
                        {!initialBillableItems?.length && (
                            <div className="flex gap-4 p-1 bg-muted/50 rounded-lg w-fit">
                                <button
                                    onClick={() => setRecipientType('customer')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${recipientType === 'customer' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Customer
                                </button>
                                <button
                                    onClick={() => setRecipientType('property')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${recipientType === 'property' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Property / Unit
                                </button>
                            </div>
                        )}

                        {recipientType === 'customer' ? (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Customer</label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={e => setSelectedCustomerId(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground transition-shadow shadow-sm"
                                >
                                    <option value="">Select a Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Property</label>
                                    <select
                                        value={selectedPropertyId}
                                        onChange={e => {
                                            setSelectedPropertyId(e.target.value);
                                            setSelectedUnitId(''); // Reset unit when property changes
                                        }}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground transition-shadow shadow-sm"
                                    >
                                        <option value="">Select a Property</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Unit</label>
                                    <select
                                        value={selectedUnitId}
                                        onChange={e => setSelectedUnitId(e.target.value)}
                                        disabled={!selectedPropertyId}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50 text-foreground transition-shadow shadow-sm disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select a Unit</option>
                                        {units.filter(u => u.propertyId === selectedPropertyId).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Issue Date</label>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={e => setInvoiceDate(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-foreground">Invoice Items</h3>

                        <div className="flex items-center gap-4">
                            {/* Tax Rate Control */}
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
                                <span className="text-xs font-medium text-muted-foreground">Tax Rate:</span>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        className="w-12 bg-transparent text-right text-sm font-bold focus:outline-none border-b border-transparent focus:border-primary transition-colors"
                                    />
                                    <span className="text-xs text-muted-foreground font-bold ml-0.5">%</span>
                                </div>
                            </div>

                            <button onClick={handleAddItem} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                                <PlusIcon className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-border rounded-xl shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 w-5/12">Item / Description</th>
                                    <th className="px-6 py-4 w-24 text-center">Qty</th>
                                    <th className="px-6 py-4 w-32 text-right">Price</th>
                                    <th className="px-6 py-4 w-32 text-right">Total</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                                placeholder="Enter item description"
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-0"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                                                className="w-16 text-center bg-muted/30 border border-transparent hover:border-border rounded p-1 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={e => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                                                    className="w-24 text-right bg-muted/30 border border-transparent hover:border-border rounded p-1 pl-4 text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">
                                            ${(item.totalPrice || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleRemoveItem(idx)} className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                                            No items added. Click "Add Item" to start.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col items-end border-t border-border pt-6">
                    <div className="w-full max-w-sm space-y-4 bg-muted/10 p-6 rounded-xl border border-border/50">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground items-center">
                            <span>Tax ({taxRate}%)</span>
                            <span className="font-medium text-foreground">${taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-foreground border-t border-border pt-4 mt-2">
                            <span>Total Due</span>
                            <span className="text-primary">${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-6 flex justify-end gap-4">
                    <button onClick={onBack} className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors">Cancel</button>
                    <button onClick={() => handleSave('Draft')} disabled={loading} className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors">Save as Draft</button>
                    <button onClick={() => setViewState('preview')} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Review & Send Invoice</button>
                </div>
            </div >


            <UnbilledItemsModal
                isOpen={isBillbackModalOpen}
                onClose={() => setIsBillbackModalOpen(false)}
                companyId={currentCompanyId}
                customerId={selectedCustomerId}
                propertyName={customers.find(c => c.id === selectedCustomerId)?.name} // Optional visual aid
                onImport={handleImportItems}
            />
        </div >
    );
};

export default CreateInvoice;
