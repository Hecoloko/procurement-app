import React, { useState, useEffect } from 'react';
import { Invoice } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCardIcon, QrCodeIcon, BuildingLibraryIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ProcureProLogoIcon } from '../../Icons';
import StatusModal from '../../StatusModal';

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

// Inner component for Stripe Elements logic
const CheckoutForm = ({ invoice, onSuccess }: { invoice: Invoice, onSuccess: (txId: string) => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        // Simulation of Payment processing since we don't have a live backend endpoint for intents yet in this context
        // In a real app we'd fetch clientSecret from backend here.

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock success
        onSuccess('pay_mock_' + Date.now());
        setProcessing(false);

        /* Real Implementation Logic:
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement(CardElement)!,
        });

        if (paymentMethodError) {
            setError(paymentMethodError.message || 'Payment failed');
            setProcessing(false);
            return;
        }

        // Call backend to charge
        // const response = await fetch('/api/charge-invoice', { ... });
        */
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg bg-background">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    },
                }} />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center"
            >
                {processing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `Pay $${invoice.totalAmount.toFixed(2)}`}
            </button>
        </form>
    );
};

const InvoicePaymentPage: React.FC = () => {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'card' | 'qr' | 'bank'>('card');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; status: 'success' | 'error' | 'loading' }>({
        isOpen: false,
        title: '',
        message: '',
        status: 'success'
    });

    useEffect(() => {
        const loadInvoice = async () => {
            const path = window.location.hash.split('/pay/')[1]; // Get ID from URL
            if (!path) {
                setLoading(false);
                return;
            }
            const invoiceId = path.split('?')[0];

            if (invoiceId.toLowerCase().startsWith('demo') || invoiceId.toLowerCase().startsWith('preview')) {
                // Return immediate mock data for testing/demo
                setInvoice({
                    id: 'demo-id',
                    invoiceNumber: 'INV-DEMO-1234',
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    totalAmount: 1540.50,
                    status: 'Sent',
                    companyId: 'demo-company',
                    subtotal: 1400,
                    taxTotal: 140.50,
                    amountPaid: 0,
                    items: [
                        { id: '1', invoiceId: 'demo', description: 'Plumbing Service', quantity: 2, unitPrice: 150, totalPrice: 300 },
                        { id: '2', invoiceId: 'demo', description: 'HVAC Repair', quantity: 1, unitPrice: 1100, totalPrice: 1100 }
                    ],
                    customer: { id: 'demo-cust', name: 'Demo Customer', email: 'demo@example.com' } as any
                });
                setLoading(false);
                return;
            }

            // Use RPC to fetch public invoice without RLS issues
            const { data, error } = await supabase
                .rpc('get_public_invoice', { invoice_uuid: invoiceId });

            if (data) {
                // Map to Invoice type
                const mapped: Invoice = {
                    id: data.id,
                    invoiceNumber: data.invoice_number,
                    issueDate: data.issue_date,
                    dueDate: data.due_date,
                    status: data.status,
                    totalAmount: data.amount || data.total_amount || 0,
                    subtotal: (data.amount || data.total_amount || 0) - (data.tax_total || 0),
                    amountPaid: 0, // RPC doesn't return this yet, assume 0 for public view
                    taxTotal: data.tax_total,
                    companyId: data.company_id,
                    customerId: data.customer_id,
                    customer: data.customer,

                    items: (data.items || []).map((item: any) => ({
                        ...item,
                        unitPrice: item.unit_price,
                        totalPrice: item.total_price || (item.quantity * item.unit_price),
                        customerId: data.customer_id, // ensure link
                        invoiceId: data.id
                    }))
                };
                setInvoice(mapped);
            } else {
                console.warn("Public invoice fetch failed:", error);
            }
            setLoading(false);
        };
        loadInvoice();
    }, []);

    const handleSuccess = (txId: string) => {
        setPaymentSuccess(true);
        setModalConfig({
            isOpen: true,
            title: 'Payment Successful',
            message: `Thank you! Your payment for Invoice #${invoice?.invoiceNumber} has been processed. Transaction ID: ${txId}`,
            status: 'success'
        });

        // Update DB Logic (Simulated here, would be backend webhook)
        if (invoice) {
            // invoiceService.updateStatus(invoice.id, 'Paid');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!invoice) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <h1 className="text-2xl font-bold text-gray-800">Invoice Not Found</h1>
            <p className="text-gray-500 mt-2">The invoice link is invalid or expired.</p>
        </div>
    );

    if (paymentSuccess) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 animate-in fade-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Receieved!</h1>
            <p className="text-gray-600 mb-8 max-w-md text-center">
                Your payment of <span className="font-bold text-gray-900">${invoice.totalAmount.toFixed(2)}</span> for Invoice #{invoice.invoiceNumber} has been successfully processed.
            </p>
            <button onClick={() => window.close()} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">Close Window</button>
            <StatusModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                status={modalConfig.status}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: Invoice Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <ProcureProLogoIcon className="w-10 h-10 text-primary" />
                            <span className="text-xl font-bold text-gray-900">Alpha Property Mgmt</span>
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
                                <p className="text-sm text-gray-500 mt-1">Due Date: {new Date(invoice.dueDate || '').toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Amount Due</p>
                                <p className="text-3xl font-bold text-primary">${invoice.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 py-4 space-y-3">
                            {invoice.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.description} <span className="text-gray-400">x{item.quantity}</span>
                                    </span>
                                    <span className="font-medium text-gray-900">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${invoice.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400">
                        Ensure checks are payable to "Alpha Property Management". <br />
                        Questions? Contact billing@alphapm.com
                    </div>
                </div>

                {/* Right: Payment Method */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold mb-6 text-gray-900">Select Payment Method</h2>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab('card')}
                            className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${activeTab === 'card' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            <CreditCardIcon className="w-6 h-6" />
                            <span className="text-xs">Card</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('qr')}
                            className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${activeTab === 'qr' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            <QrCodeIcon className="w-6 h-6" />
                            <span className="text-xs">QR Code</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('bank')}
                            className={`flex-1 py-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${activeTab === 'bank' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            <BuildingLibraryIcon className="w-6 h-6" />
                            <span className="text-xs">Bank</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'card' && (
                            <Elements stripe={stripePromise}>
                                <CheckoutForm invoice={invoice} onSuccess={handleSuccess} />
                            </Elements>
                        )}

                        {activeTab === 'qr' && (
                            <div className="text-center py-6">
                                <div className="bg-white border-2 border-gray-900 p-4 rounded-xl inline-block mb-4">
                                    {/* Placeholder QR - User would replace with real image */}
                                    <QrCodeIcon className="w-48 h-48 text-gray-900" />
                                </div>
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded mb-2">Use App to Scan</p>
                                <p className="text-sm text-gray-500">Scan to pay directly with your preferred wallet app.</p>
                            </div>
                        )}

                        {activeTab === 'bank' && (
                            <div className="space-y-4 py-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bank Name</p>
                                    <p className="font-bold text-gray-900">Chase Bank</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Routing Number</p>
                                    <p className="font-mono font-bold text-gray-900">021000021</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                                    <p className="font-mono font-bold text-gray-900">8829103921</p>
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-4">Make sure to include Invoice #{invoice.invoiceNumber} in the memo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePaymentPage;
