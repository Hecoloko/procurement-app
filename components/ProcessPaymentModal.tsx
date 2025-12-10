import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    CreditCardIcon, BuildingOfficeIcon, XMarkIcon, LockClosedIcon,
    LinkIcon, QrCodeIcon, DevicePhoneMobileIcon, EnvelopeIcon, CheckCircleIcon
} from './Icons';
import { SolaIFields, getSolaToken } from './SolaIFields';
import { QRCodeCanvas } from 'qrcode.react';

interface PaymentSetting {
    id: string;
    account_label: string;
    gateway_name?: string;
}

interface SavedPaymentMethod {
    id: string;
    card_brand: string;
    card_last4: string;
    exp_month: number;
    exp_year: number;
}

interface ProcessPaymentModalProps {
    invoice: any;
    onClose: () => void;
    onProcess: (paymentData: any) => Promise<void>;
}

export default function ProcessPaymentModal({ invoice, onClose, onProcess }: ProcessPaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Data Sources
    const [accounts, setAccounts] = useState<PaymentSetting[]>([]);
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);

    // State: Mode & Selection
    const [paymentMode, setPaymentMode] = useState<'card' | 'qr'>('card');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedMethodId, setSelectedMethodId] = useState<string>('new_card');

    // State: Card Details & Options
    const [expDate, setExpDate] = useState('');
    const [zip, setZip] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [emailReceipt, setEmailReceipt] = useState('');

    // State: Feedback
    const [iFieldsError, setIFieldsError] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setInitializing(true);
        const { data: accs } = await supabase.from('company_payment_settings').select('id, account_label').eq('is_active', true);
        if (accs && accs.length > 0) {
            setAccounts(accs);
            setSelectedAccountId(accs[0].id);
        }

        const { data: methods } = await supabase.from('saved_payment_methods').select('*');
        if (methods) setSavedMethods(methods);
        setInitializing(false);
    };

    const handleCopyLink = () => {
        const link = `https://nexuspay.app/pay/${invoice.invoice_number}`; // Mock Link
        navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setIFieldsError(null);

        let paymentData: any = {
            settingsId: selectedAccountId,
            methodId: selectedMethodId,
            isNewCard: selectedMethodId === 'new_card',
            saveCard,       // Pass to handler
            emailReceipt    // Pass to handler
        };

        if (selectedMethodId === 'new_card') {
            try {
                const tokenData = await new Promise((resolve, reject) => getSolaToken(resolve, reject));
                const solaResponse = tokenData as any;

                paymentData.newCardDetails = {
                    cardNumber: solaResponse.xToken,
                    expDate,
                    cvv: '123',
                    zip
                };
            } catch (err: any) {
                console.error("Token Flow Failed:", err);
                setIFieldsError(err.toString());
                setLoading(false);
                return;
            }
        }
        await onProcess(paymentData);
        setLoading(false);
    };

    if (initializing) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>;

    const paymentLink = `https://nexuspay.app/pay/${invoice.invoice_number}`;

    return (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Process Payment</h3>
                        <p className="text-sm text-gray-500">Invoice #{invoice.invoice_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                            {linkCopied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                            {linkCopied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 shrink-0">
                    <button
                        onClick={() => setPaymentMode('card')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${paymentMode === 'card' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <CreditCardIcon className="w-5 h-5" /> Pay with Card
                    </button>
                    <button
                        onClick={() => setPaymentMode('qr')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${paymentMode === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <QrCodeIcon className="w-5 h-5" /> Mobile / QR
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Amount Banner */}
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 shrink-0">
                        <span className="text-blue-700 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-900">${invoice.amount.toFixed(2)}</span>
                    </div>

                    {paymentMode === 'card' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Digital Wallets (Mock/Placeholder) */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-lg hover:opacity-90 transition-opacity">
                                    <span className="font-semibold tracking-tight"> Pay</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="font-semibold">G Pay</span>
                                </button>
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or pay with card</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            {/* Account Selection */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Pay From Account</label>
                                <div className="relative">
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none text-gray-700 font-medium"
                                    >
                                        {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.account_label || 'Default Account'}</option>))}
                                    </select>
                                    <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Method Selection */}
                            <div className="space-y-3">
                                {savedMethods.map(method => (
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

                            {/* New Card Fields */}
                            {selectedMethodId === 'new_card' && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-fadeIn">
                                    <SolaIFields onLoad={() => console.log('Sola Ready')} onError={(e) => setIFieldsError(e)} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Expiry (MMYY)</label>
                                            <input type="text" placeholder="MMYY" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Zip Code</label>
                                            <input type="text" placeholder="12345" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                    </div>

                                    {/* UI Polish: Save Card & Email */}
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                            <span className="text-sm text-gray-700">Save this card for future payments</span>
                                        </label>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email Receipt To (Optional)</label>
                                            <div className="relative">
                                                <input type="email" placeholder="accounting@company.com" value={emailReceipt} onChange={(e) => setEmailReceipt(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {iFieldsError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{iFieldsError}</div>}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay $${invoice.amount.toFixed(2)}`
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // QR Code View
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-fadeIn">
                            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                                <QRCodeCanvas value={paymentLink} size={200} level={"H"} includeMargin={true} />
                            </div>

                            <div className="space-y-2 max-w-xs">
                                <h4 className="text-lg font-bold text-gray-900">Scan to Pay on Mobile</h4>
                                <p className="text-sm text-gray-500">Use your phone's camera to scan this code and pay securely via Apple Pay or Google Pay.</p>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                                <DevicePhoneMobileIcon className="w-4 h-4" />
                                <span>Compatible with iOS & Android</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
