import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    CreditCardIcon, BuildingOfficeIcon, XMarkIcon, LockClosedIcon,
    LinkIcon, CheckCircleIcon, ClipboardDocumentIcon
} from './Icons';
import { CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { StripeWrapper } from './StripeWrapper';
import { SolaIFields, getSolaToken } from './SolaIFields';

interface PaymentSetting {
    id: string;
    account_label: string;
    solaXKey?: string;
    gateway_name?: string;
}

interface ProcessPaymentModalProps {
    invoice: any;
    onClose: () => void;
    onProcess: (paymentData: any) => Promise<void>;
}

const PaymentForm = ({ invoice, onClose, onProcess, accounts, savedMethods }: any) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    // State: Selection
    const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
    const [selectedMethodId, setSelectedMethodId] = useState<string>('new_card');
    const [saveCard, setSaveCard] = useState(false);
    const [emailReceipt, setEmailReceipt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [paymentRequest, setPaymentRequest] = useState<any>(null);

    const activeAccount = accounts.find((a: any) => a.id === selectedAccountId);
    const isSola = !!activeAccount?.solaXKey;

    // Setup Payment Request (Apple/Google Pay) - Only for Stripe
    useEffect(() => {
        if (!stripe || isSola) return;
        const pr = stripe.paymentRequest({
            country: 'US',
            currency: 'usd',
            total: {
                label: `Invoice #${invoice.invoice_number}`,
                amount: Math.round(invoice.amount * 100), // cents
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        pr.canMakePayment().then(result => {
            if (result) setPaymentRequest(pr);
        });
    }, [stripe, invoice, isSola]);

    const handleFillTestCard = () => {
        // Since CardElement is an iframe, we cannot programmatically fill it. 
        // We will copy to clipboard and notify user.
        navigator.clipboard.writeText('4242424242424242');
        alert("Test Card Number (4242...) copied to clipboard! Paste it into the card field. Use any future date and CVC.");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (selectedMethodId === 'new_card') {

            if (isSola) {
                // Sola Logic
                getSolaToken(
                    async (response) => {
                        console.log("Sola Token Generated:", response);
                        await onProcess({
                            settingsId: selectedAccountId,
                            methodId: 'new_card_sola',
                            token: response.xToken,
                            gateway: 'sola',
                            saveCard,
                            emailReceipt
                        });
                        setLoading(false);
                    },
                    (err) => {
                        setError(typeof err === 'string' ? err : 'Payment Validation Failed');
                        setLoading(false);
                    }
                );
                return; // Early return, callback handles completion
            }

            // Stripe Logic
            if (!stripe || !elements) return;

            const cardElement = elements.getElement(CardElement);
            if (!cardElement) return;

            // In a real app, you would create a PaymentIntent on the backend and confirm properly.
            // For now, we simulate the "Token" generation which the original app expected.
            const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: { email: emailReceipt }
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment Failed');
                setLoading(false);
                return;
            }

            console.log("[Stripe] Payment Method Created:", paymentMethod);

            // Pass the PaymentMethod ID (pm_...) instead of raw token
            await onProcess({
                settingsId: selectedAccountId,
                methodId: paymentMethod.id, // Correct param name for Stripe PM
                gateway: 'stripe',
                saveCard,
                emailReceipt
            });

        } else {
            // Saved Method Logic
            const savedMethod = savedMethods.find((m: any) => m.id === selectedMethodId);
            const isStripeSaved = savedMethod?.gateway === 'stripe';

            await onProcess({
                settingsId: selectedAccountId,
                methodId: isStripeSaved ? savedMethod.stripe_payment_method_id : undefined,
                paymentToken: !isStripeSaved ? savedMethod.sola_xtoken : undefined,
                gateway: savedMethod?.gateway || 'stripe',
                saveCard: false,
                emailReceipt
            });
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Apple/Google Pay - Only if Stripe */}
            {!isSola && paymentRequest && (
                <div className="mb-6">
                    <PaymentRequestButtonElement options={{ paymentRequest }} />
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or pay with card</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                </div>
            )}

            {/* Account Selection */}
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Pay From Account</label>
                <div className="relative">
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700 font-medium"
                    >
                        {accounts.map((acc: any) => (<option key={acc.id} value={acc.id}>{acc.account_label || 'Default Account'}</option>))}
                    </select>
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Method Selection */}
            <div className="space-y-3">
                {savedMethods.map((method: any) => (
                    <label key={method.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedMethodId === method.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center gap-3">
                            <input type="radio" value={method.id} checked={selectedMethodId === method.id} onChange={(e) => setSelectedMethodId(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                            <div>
                                <span className="font-medium text-gray-900 block">{method.card_brand} •••• {method.card_last4}</span>
                                <span className="text-xs text-gray-500">Expires {method.exp_month}/{method.exp_year}</span>
                            </div>
                        </div>
                    </label>
                ))}
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedMethodId === 'new_card' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" value="new_card" checked={selectedMethodId === 'new_card'} onChange={(e) => setSelectedMethodId(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                        <span className="font-medium text-gray-900">New Secure Card</span>
                    </div>
                    <LockClosedIcon className="w-4 h-4 text-green-600" />
                </label>
            </div>

            {/* New Card Fields (Dynamic based on Gateway) */}
            {selectedMethodId === 'new_card' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-fadeIn">

                    {isSola ? (
                        <div className="bg-white p-3 border border-gray-300 rounded-lg">
                            <SolaIFields />
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                <CardElement options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': { color: '#aab7c4' },
                                        },
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
                                    Copy Test Card (4242)
                                </button>
                            </div>
                        </>
                    )}

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                            <span className="text-sm text-gray-700">Save this card for future payments</span>
                        </label>
                        <div>
                            <input type="email" placeholder="Email Receipt (Optional)" value={emailReceipt} onChange={(e) => setEmailReceipt(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading || (!stripe && !isSola)} className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? 'Processing...' : `Pay $${invoice.amount.toFixed(2)}`}
                </button>
            </div>

            <div className="mt-4 text-center">
                <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <LockClosedIcon className="w-3 h-3" />
                    Payment processed securely by <strong>{isSola ? 'Sola' : 'Stripe'}</strong>
                </span>
            </div>
        </form>
    );
};

export default function StripePaymentModal({ invoice, onClose, onProcess }: ProcessPaymentModalProps) {
    const [initializing, setInitializing] = useState(true);
    const [accounts, setAccounts] = useState<PaymentSetting[]>([]);
    const [savedMethods, setSavedMethods] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setInitializing(true);
        const { data: accs } = await supabase.from('company_payment_settings').select('id, account_label, solaXKey:sola_xkey_text').eq('is_active', true);
        if (accs) setAccounts(accs);
        const { data: methods } = await supabase.from('saved_payment_methods').select('*');
        if (methods) setSavedMethods(methods);
        setInitializing(false);
    };

    if (initializing) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>;

    return (
        <StripeWrapper>
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Process Payment</h3>
                            <p className="text-sm text-gray-500">Invoice #{invoice.invoice_number}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 shrink-0">
                            <span className="text-blue-700 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-blue-900">${invoice.amount.toFixed(2)}</span>
                        </div>
                        <PaymentForm invoice={invoice} onClose={onClose} onProcess={onProcess} accounts={accounts} savedMethods={savedMethods} />
                        {/* Footer moved inside form for dynamic state access */}
                    </div>
                </div>
            </div>
        </StripeWrapper>
    );
}
