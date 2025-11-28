import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from './Icons';

interface ChartOfAccountsProps {
    accounts: Account[];
    onAddAccount: (account: Omit<Account, 'id'>) => void;
    onUpdateAccount: (account: Account) => void;
    onDeleteAccount: (accountId: string) => void;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ accounts, onAddAccount, onUpdateAccount, onDeleteAccount }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState<Partial<Account>>({
        type: 'Asset',
        isActive: true
    });

    const filteredAccounts = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return accounts.filter(acc =>
            acc.name.toLowerCase().includes(lowerQuery) ||
            acc.code.toLowerCase().includes(lowerQuery) ||
            acc.type.toLowerCase().includes(lowerQuery)
        ).sort((a, b) => a.code.localeCompare(b.code));
    }, [accounts, searchQuery]);

    const handleOpenModal = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData(account);
        } else {
            setEditingAccount(null);
            setFormData({ type: 'Asset', isActive: true, companyId: accounts[0]?.companyId || '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAccount) {
            onUpdateAccount({ ...editingAccount, ...formData } as Account);
        } else {
            onAddAccount(formData as Omit<Account, 'id'>);
        }
        setIsModalOpen(false);
    };

    const accountTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Chart of Accounts</h1>
                    <p className="text-muted-foreground mt-1">Manage your general ledger accounts.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Account
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by code, name, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-medium">Code</th>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Subtype</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAccounts.map(account => (
                                <tr key={account.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-medium text-foreground">{account.code}</td>
                                    <td className="px-6 py-4 font-medium text-foreground">{account.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${account.type === 'Asset' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                account.type === 'Liability' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    account.type === 'Equity' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        account.type === 'Income' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                            }`}>
                                            {account.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{account.subtype || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {account.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(account)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteAccount(account.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No accounts found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Account Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code || ''}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Account Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                                    >
                                        {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="e.g. Cash on Hand"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Subtype (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.subtype || ''}
                                    onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="e.g. Current Assets"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-input text-primary focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active Account</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors shadow-sm"
                                >
                                    {editingAccount ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccounts;
