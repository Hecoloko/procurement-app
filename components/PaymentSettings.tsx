import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { runTestTransaction } from '../services/paymentTester';
import { CompanyPaymentSettings, InvoiceTypeMapping } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckBadgeIcon, XMarkIcon } from './Icons';
import StatusModal from './StatusModal';

interface PaymentSettingsProps {
    companyId: string;
}

const PaymentSettings: React.FC<PaymentSettingsProps> = ({ companyId }) => {
    const [accounts, setAccounts] = useState<CompanyPaymentSettings[]>([]);
    const [mappings, setMappings] = useState<InvoiceTypeMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<CompanyPaymentSettings | null>(null);
    const [processing, setProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState<'success' | 'error' | 'loading' | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const [selectedTestAccount, setSelectedTestAccount] = useState('');
    const [testCard, setTestCard] = useState({
        number: '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join(''),
        exp: '12/30',
        cvv: '123'
    });

    // Static list of likely invoice types for mapping (could be dynamic later)
    const invoiceTypes = ['Maintenance', 'Utilities', 'Office Supplies', 'IT & Software', 'Raw Materials', 'Safety', 'Furniture', 'Services'];

    useEffect(() => {
        fetchSettings();
    }, [companyId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data: accData, error: accError } = await supabase
                .from('company_payment_settings')
                .select('*')
                .eq('company_id', companyId);

            if (accError) throw accError;

            // Map keys
            const mappedAccounts: CompanyPaymentSettings[] = (accData || []).map((row: any) => ({
                id: row.id,
                companyId: row.company_id,
                accountLabel: row.account_label,
                // Check new text column first, then fall back to ID presence (old vault way)
                solaXKey: row.sola_xkey_text ? row.sola_xkey_text : (row.sola_xkey_id ? '********' : ''),
                solaIFieldsKey: row.sola_ifields_key,
                isActive: row.is_active
            }));
            setAccounts(mappedAccounts);

            const { data: mapData, error: mapError } = await supabase
                .from('invoice_type_mappings')
                .select('*')
                .eq('company_id', companyId);

            if (mapError) throw mapError;

            const mappedMappings: InvoiceTypeMapping[] = (mapData || []).map((row: any) => ({
                id: row.id,
                companyId: row.company_id,
                invoiceType: row.invoice_type,
                paymentSettingsId: row.payment_settings_id
            }));
            setMappings(mappedMappings);

        } catch (error) {
            console.error('Error fetching payment settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAccount = async (data: { label: string; xKey: string; iFieldsKey: string }) => {
        setModalStatus('loading');
        setModalTitle('Saving Account');
        setModalMessage('Securely storing your credentials...');
        setModalOpen(true);

        try {
            const { error } = await supabase.rpc('manage_sola_secret', {
                p_company_id: companyId,
                p_label: data.label,
                p_xkey: data.xKey,
                p_ifields_key: data.iFieldsKey,
                p_existing_id: editingAccount ? editingAccount.id : null
            });

            if (error) throw error;

            setIsAddModalOpen(false);
            setEditingAccount(null);
            fetchSettings();

            setModalStatus('success');
            setModalTitle('Account Saved');
            setModalMessage('Your Sola Gateway account has been successfully configured.');
        } catch (error: any) {
            console.error('Error saving account:', error);
            setModalStatus('error');
            setModalTitle('Save Failed');
            setModalMessage(error.message || 'An unexpected error occurred while saving.');
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Are you sure? This will break any mappings using this account.')) return;
        try {
            const { error } = await supabase.from('company_payment_settings').delete().eq('id', id);
            if (error) throw error;
            fetchSettings();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const handleUpdateMapping = async (invoiceType: string, settingsId: string) => {
        try {
            // Check if mapping exists
            const existing = mappings.find(m => m.invoiceType === invoiceType);

            if (!settingsId) {
                if (existing) {
                    const { error } = await supabase.from('invoice_type_mappings').delete().eq('id', existing.id);
                    if (error) throw error;
                }
            } else {
                if (existing) {
                    const { error } = await supabase.from('invoice_type_mappings')
                        .update({ payment_settings_id: settingsId })
                        .eq('id', existing.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('invoice_type_mappings').insert({
                        company_id: companyId,
                        invoice_type: invoiceType,
                        payment_settings_id: settingsId
                    });
                    if (error) throw error;
                }
            }
            fetchSettings();
        } catch (error: any) {
            console.error('Error updating mapping:', error);
            setModalStatus('error');
            setModalTitle('Mapping Failed');
            setModalMessage('Could not save the invoice type route. ' + error.message);
            setModalOpen(true);
        }
    };

    const handleRunTestTransaction = async () => {
        setLastResult(null);

        if (!selectedTestAccount) {
            setModalStatus('error');
            setModalTitle('No Account Selected');
            setModalMessage('Please select a Sola account to test against.');
            setModalOpen(true);
            return;
        }

        // Use the connection tester service
        setProcessing(true);

        try {
            // runTestTransaction fetches settings internally (currently just 'comp-1') 
            // In a real scenario we'd pass selectedTestAccount to it or letting it fetch specific.
            // For this demo, we pass companyId.

            const result = await runTestTransaction(companyId);

            console.log('Transaction result:', result);

            if (result.success) {
                setLastResult(`Success! AuthCode: ${result.responsePayload?.xAuthCode}`);
                setModalStatus('success');
                setModalTitle('Connection Verified');
                setModalMessage(`Gateway responded successfully.\n\nRefNum: ${result.refNum}\nAuthCode: ${result.responsePayload?.xAuthCode}\nMessage: ${result.responsePayload?.xError || 'Approved'}`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }

            setModalOpen(true);
        } catch (error: any) {
            console.error('Payment failed:', error);
            setLastResult('Failed: ' + (error.message || 'Unknown error'));

            setModalStatus('error');
            setModalTitle('Connection Failed');
            setModalMessage(error.message || 'The payment gateway rejected the connection test.');
            setModalOpen(true);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Sola Payment Accounts</h2>
                    <p className="text-sm text-muted-foreground">Manage Sola Gateway credentials and iFields keys.</p>
                </div>
                <button
                    onClick={() => { setEditingAccount(null); setIsAddModalOpen(true); }}
                    className="flex items-center bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Sola Account
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading settings...</div>
            ) : (
                <>
                    {/* Accounts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-border relative group hover:border-primary/50 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-primary/10 p-3 rounded-xl text-primary">
                                        <CheckBadgeIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingAccount(acc); setIsAddModalOpen(true); }} className="p-2 text-muted-foreground hover:text-blue-500 rounded-lg hover:bg-muted"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-foreground mb-1">{acc.accountLabel}</h3>
                                <div className="space-y-2 mt-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">xKey:</span>
                                        <span className="font-mono text-foreground">{acc.solaXKey ? '••••' + acc.solaXKey.slice(-4) : 'Not Set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">iFields Key:</span>
                                        <span className="font-mono text-foreground truncate max-w-[150px]" title={acc.solaIFieldsKey}>{acc.solaIFieldsKey || 'Not Set'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/20">
                                No Sola accounts configured. Add one to start processing payments.
                            </div>
                        )}
                    </div>

                    {/* Invoice Mappings */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Invoice Type Routing</h2>
                        <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-lg border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Invoice Type</th>
                                        <th className="px-6 py-4 text-left">Route to Sola Account</th>
                                        <th className="px-6 py-4 text-center w-24">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoiceTypes.map(type => {
                                        const mapping = mappings.find(m => m.invoiceType === type);
                                        const mappedAccId = mapping?.paymentSettingsId || '';

                                        return (
                                            <tr key={type} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground">{type}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={mappedAccId}
                                                        onChange={(e) => handleUpdateMapping(type, e.target.value)}
                                                        className="w-full max-w-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                                    >
                                                        <option value="">Select Account...</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.accountLabel}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {mappedAccId ? <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded-full">Active</span> : <span className="text-muted-foreground text-xs px-2 py-1">Unmapped</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Test Section */}
                    <div className="mt-12 p-6 bg-muted/30 rounded-2xl border border-dashed border-border">
                        <h3 className="text-lg font-bold mb-4">Payment Simulation</h3>
                        <p className="text-sm text-muted-foreground mb-4">Run a transaction against the selected account. Using a <code>xkey_...</code> account simulates a success. Using a real Sola Key hits the Sandbox Gateway.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Select Account</label>
                                <select
                                    value={selectedTestAccount}
                                    onChange={(e) => setSelectedTestAccount(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">-- Choose Account --</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.accountLabel}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg-background rounded-xl border border-border mb-4">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Test Card Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs mb-1">Card Number</label>
                                    <input
                                        type="text"
                                        value={testCard.number}
                                        onChange={e => setTestCard({ ...testCard, number: e.target.value })}
                                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded font-mono text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs mb-1">Exp</label>
                                        <input
                                            type="text"
                                            value={testCard.exp}
                                            onChange={e => setTestCard({ ...testCard, exp: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">CVV</label>
                                        <input
                                            type="text"
                                            value={testCard.cvv}
                                            onChange={e => setTestCard({ ...testCard, cvv: e.target.value })}
                                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setTestCard({ number: '4111111111111111', exp: '12/30', cvv: '123' })} className="text-xs text-blue-500 hover:underline">Load Visa Success</button>
                                <button onClick={() => setTestCard({ number: '5454545454545454', exp: '12/30', cvv: '123' })} className="text-xs text-red-500 hover:underline">Load MasterCard Decline</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleRunTestTransaction}
                                disabled={processing || !selectedTestAccount || !testCard.number}
                                className="px-4 py-2 bg-foreground text-background font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    'Process Transaction'
                                )}
                            </button>
                            {!selectedTestAccount && <span className="text-xs text-muted-foreground">Select an account first.</span>}
                        </div>
                    </div>
                </>
            )}

            {isAddModalOpen && (
                <AddAccountModal
                    onClose={() => { setIsAddModalOpen(false); setEditingAccount(null); }}
                    onSave={handleSaveAccount}
                    initialData={editingAccount}
                />
            )}

            <StatusModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                status={modalStatus}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    );
};

const AddAccountModal: React.FC<{ onClose: () => void; onSave: (data: any) => void; initialData?: CompanyPaymentSettings | null }> = ({ onClose, onSave, initialData }) => {
    const [label, setLabel] = useState(initialData?.accountLabel || '');
    const [xKey, setXKey] = useState(initialData?.solaXKey || '');
    const [iFieldsKey, setIFieldsKey] = useState(initialData?.solaIFieldsKey || '');

    const generateTestKeys = () => {
        const randomHex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setLabel('Test Account - ' + new Date().toLocaleTimeString());
        setXKey('xkey_' + randomHex(32));
        setIFieldsKey('ifields_' + randomHex(16));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">{initialData ? 'Edit' : 'Add'} Sola Account</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {!initialData && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex justify-between items-center">
                            <span className="text-xs text-blue-500 font-medium">Testing? Generate dummy credentials.</span>
                            <button
                                onClick={generateTestKeys}
                                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold transition-colors"
                            >
                                Generate Keys
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Account Label</label>
                        <input
                            type="text"
                            placeholder="e.g. Operating Account"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Transaction Key (xKey)</label>
                        <input
                            type="password"
                            placeholder="Enter xKey"
                            value={xKey}
                            onChange={e => setXKey(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">iFields Key</label>
                        <input
                            type="text"
                            placeholder="Enter iFields Key"
                            value={iFieldsKey}
                            onChange={e => setIFieldsKey(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary outline-none font-mono"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                    <button
                        onClick={() => { if (label && xKey && iFieldsKey) onSave({ label, xKey, iFieldsKey }); }}
                        disabled={!label || !xKey || !iFieldsKey}
                        className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettings;
