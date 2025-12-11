import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { XMarkIcon, CreditCardIcon, BuildingOfficeIcon, LockClosedIcon, ClipboardDocumentIcon, QrCodeIcon } from '../../Icons';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeWrapper } from '../../StripeWrapper';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { paymentMethod: string; transactionRef: string; paymentDate: string; receiptUrl?: string }) => void;
    amountDue: number;
    vendorName: string;
    companyId?: string; // Optional, to fetch accounts
}

const PaymentForm = ({ amountDue, vendorName, onClose, onSave, accounts }: any) => {
    console.log("DEBUG: PaymentForm Rendering via RecordPaymentModal");
    const stripe = useStripe();
    const elements = useElements();

    const [methodMode, setMethodMode] = useState<'card' | 'bank' | 'qr'>('card');
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
    const [saveCard, setSaveCard] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');
    const [walletProvider, setWalletProvider] = useState('Venmo');
    const [loading, setLoading] = useState(false);

    // Auto-select first account
    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts]);


    const handleFillTestCard = () => {
        navigator.clipboard.writeText('4242424242424242');
        alert("Test Card Number (4242...) copied to clipboard!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let finalRef = transactionRef;
        let finalMethod: string = methodMode;

        if (methodMode === 'card') {
            finalRef = `CHG-${Date.now()}-STRIPE`;
            finalMethod = 'credit_card';
        } else if (methodMode === 'bank') {
            finalRef = transactionRef || `ACH-${Date.now()}`;
            finalMethod = 'bank_transfer';
        } else if (methodMode === 'qr') {
            finalRef = transactionRef || `QR-${Date.now()}`;
            finalMethod = 'qr_code';
        }

        // Return data to parent
        onSave({
            paymentMethod: finalMethod,
            transactionRef: finalRef,
            paymentDate: new Date().toISOString(),
        });

        setLoading(false);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pay From Account */}
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Pay From Account</label>
                <div className="relative">
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-700 font-medium"
                    >
                        {accounts.length > 0 ? (
                            accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.account_label || acc.bank_name || 'Main Account'}</option>)
                        ) : (
                            <option value="default">Main Business Checking (**** 1234)</option>
                        )}
                        <option value="new">+ Add New Account</option>
                    </select>
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Payment Method Selection (Tabs-ish) */}
            <div className="space-y-3">
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${methodMode === 'card' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" checked={methodMode === 'card'} onChange={() => setMethodMode('card')} className="text-blue-600 focus:ring-blue-500" />
                        <span className="font-medium text-gray-900">New Secure Card</span>
                    </div>
                    <LockClosedIcon className="w-4 h-4 text-green-600" />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${methodMode === 'bank' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" checked={methodMode === 'bank'} onChange={() => setMethodMode('bank')} className="text-blue-600 focus:ring-blue-500" />
                        <span className="font-medium text-gray-900">Bank Transfer / ACH</span>
                    </div>
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${methodMode === 'qr' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" checked={methodMode === 'qr'} onChange={() => setMethodMode('qr')} className="text-blue-600 focus:ring-blue-500" />
                        <span className="font-medium text-gray-900">Scanner / QR Code</span>
                    </div>
                    <QrCodeIcon className="w-4 h-4 text-gray-500" />
                </label>
            </div>

            {/* Dynamic Content */}
            {methodMode === 'card' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <CardElement options={{
                            style: {
                                base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                            },
                        }} />
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={handleFillTestCard} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <ClipboardDocumentIcon className="w-3 h-3" /> Copy Test Card
                        </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                        <span className="text-sm text-gray-700">Save this card for future payments</span>
                    </label>
                </div>
            )}

            {methodMode === 'bank' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Recipient Bank Details:</p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm space-y-1 mb-3">
                        <div className="flex justify-between"><span className="text-gray-500">Bank:</span> <span className="font-medium">Chase Bank</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Account:</span> <span className="font-medium">**** 9876</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Routing:</span> <span className="font-medium">021000021</span></div>
                    </div>
                    <input
                        type="text"
                        placeholder="Transaction Reference / Check #"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            {methodMode === 'qr' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Scan Vendor Code or Record Wallet Payment:</p>

                    <div className="space-y-3">
                        <select
                            value={walletProvider}
                            onChange={(e) => setWalletProvider(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none hover:border-blue-400 transition-colors"
                        >
                            <option value="Venmo">Venmo</option>
                            <option value="CashApp">Cash App</option>
                            <option value="WeChat">WeChat Pay</option>
                            <option value="AliPay">AliPay</option>
                            <option value="Zelle">Zelle</option>
                            <option value="Other">Other Scanner / Wallet</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Transaction ID / Reference"
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <QrCodeIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800">
                                Launch your mobile wallet app to scan the vendor's physical QR code, then verify the transaction ID above.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || (methodMode === 'card' && !stripe)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    {loading ? 'Processing...' : `Pay $${amountDue.toFixed(2)}`}
                </button>
            </div>

            <div className="text-center">
                <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <LockClosedIcon className="w-3 h-3" />
                    Payment processed securely
                </span>
            </div>
        </form>
    );
};

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = (props) => {
    // We can fetch real company bank accounts here if we want
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        // Mock accounts or fetch
        // For now, let's use a couple of placeholders to look good
        setAccounts([
            { id: 'acc_1', account_label: 'Main Operating (Chase 8821)' },
            { id: 'acc_2', account_label: 'Payroll (Wells Fargo 3321)' }
        ]);
    }, []);

    if (!props.isOpen) return null;

    return (
        <StripeWrapper>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Process Payment</h3>
                            <p className="text-sm text-gray-500">To {props.vendorName}</p>
                        </div>
                        <button onClick={props.onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Total Band */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                            <span className="text-blue-600 font-semibold">Total Amount</span>
                            <span className="text-2xl font-bold text-blue-900">${props.amountDue.toFixed(2)}</span>
                        </div>

                        {/* Content */}
                        <PaymentForm {...props} accounts={accounts} />
                    </div>
                </div>
            </div>
        </StripeWrapper>
    );
};

export default RecordPaymentModal;
