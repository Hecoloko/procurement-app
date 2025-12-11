import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { QRCodeCanvas } from 'qrcode.react';
import {
    XMarkIcon, CreditCardIcon, QrCodeIcon, CheckCircleIcon,
    DevicePhoneMobileIcon, LinkIcon, LockClosedIcon, ClipboardDocumentIcon
} from '../../Icons';
import { StripeWrapper } from '../../StripeWrapper';

interface InvoicePaymentModalProps {
    invoice: any;
    onClose: () => void;
    onPaymentComplete: (result: any) => void;
}

const PaymentContent = ({ invoice, onClose, onPaymentComplete }: any) => {
    const stripe = useStripe();
    const elements = useElements();
    const [mode, setMode] = useState<'card' | 'qr' | 'manual'>('card');
    const [manualRef, setManualRef] = useState('');
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    const paymentLink = `https://nexuspay.app/pay/${invoice.invoice_number}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(paymentLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleFillTestCard = () => {
        navigator.clipboard.writeText('4242424242424242');
        alert("Test Card Number (4242...) copied to clipboard!");
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onPaymentComplete({
            success: true,
            method: 'manual',
            paymentDate: manualDate,
            reference: manualRef,
            amount: invoice.balance_due || invoice.total_amount
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setLoading(false);
            return;
        }

        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (stripeError) {
            setError(stripeError.message || 'Payment failed');
            setLoading(false);
            return;
        }

        console.log("AR Payment Method Created:", paymentMethod);
        // Here we would call backend to charge the customer
        await onPaymentComplete({
            success: true,
            methodId: paymentMethod.id, // Align with unified service
            gateway: 'stripe',
            amount: invoice.total_amount
        });
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Receive Payment</h3>
                    <p className="text-sm text-gray-500">Invoice #{invoice.invoice_number}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Total */}
            <div className="p-6 pb-0">
                <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100 mb-6">
                    <span className="text-green-700 font-medium">Balance Due</span>
                    <span className="text-2xl font-bold text-green-900">${invoice.balance_due?.toFixed(2) || invoice.total_amount?.toFixed(2)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
                <button
                    onClick={() => setMode('card')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 px-4 whitespace-nowrap ${mode === 'card' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <CreditCardIcon className="w-5 h-5" /> Pay Now (Stripe)
                </button>
                <button
                    onClick={() => setMode('qr')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 px-4 whitespace-nowrap ${mode === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <QrCodeIcon className="w-5 h-5" /> Customer Link
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 px-4 whitespace-nowrap ${mode === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <ClipboardDocumentIcon className="w-5 h-5" /> Record Manual
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {mode === 'card' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="p-4 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                            <CardElement options={{
                                style: {
                                    base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                                },
                            }} />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleFillTestCard}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <ClipboardDocumentIcon className="w-3 h-3" />
                                Test Card (4242)
                            </button>
                        </div>

                        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading || !stripe}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {loading ? 'Processing...' : `Charge Customer $${invoice.balance_due || invoice.total_amount}`}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                            <LockClosedIcon className="w-3 h-3" />
                            <span>Payments processed securely via Stripe</span>
                        </div>
                    </form>
                ) : mode === 'manual' ? (
                    <form onSubmit={handleManualSubmit} className="space-y-6 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                            <input
                                type="number"
                                required
                                readOnly // Assuming full payment for simple manual record for now, or allow edit
                                value={invoice.balance_due || invoice.total_amount}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                            <input
                                type="date"
                                required
                                value={manualDate}
                                onChange={e => setManualDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Cheque #</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. ACH-12345 or CHQ-999"
                                value={manualRef}
                                onChange={e => setManualRef(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-colors"
                        >
                            Mark as Paid
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <QRCodeCanvas value={paymentLink} size={220} level={"H"} includeMargin={true} />
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <LinkIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600 truncate flex-1">{paymentLink}</span>
                                <button onClick={handleCopyLink} className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap px-2">
                                    {linkCopied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-center text-sm text-gray-500">
                                Share this link or ask the customer to scan the QR code to pay instantly via Apple Pay, Google Pay, or Card.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function InvoicePaymentModal(props: InvoicePaymentModalProps) {
    return (
        <StripeWrapper>
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden h-[600px] flex flex-col">
                    <PaymentContent {...props} />
                </div>
            </div>
        </StripeWrapper>
    );
}
