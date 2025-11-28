import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, FilterIcon } from './Icons';
import { Select } from './ui/Select';

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
    const [filterType, setFilterType] = useState<string>('All');

    const filteredAccounts = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return accounts.filter(acc =>
            (filterType === 'All' || acc.type === filterType) &&
            (acc.name.toLowerCase().includes(lowerQuery) ||
                acc.code.toLowerCase().includes(lowerQuery) ||
                acc.type.toLowerCase().includes(lowerQuery))
        ).sort((a, b) => a.code.localeCompare(b.code));
    }, [accounts, searchQuery, filterType]);

    const stats = useMemo(() => {
        return {
            total: accounts.length,
            assets: accounts.filter(a => a.type === 'Asset').length,
            liabilities: accounts.filter(a => a.type === 'Liability').length,
            equity: accounts.filter(a => a.type === 'Equity').length,
            income: accounts.filter(a => a.type === 'Income').length,
            expenses: accounts.filter(a => a.type === 'Expense').length
        };
    }, [accounts]);

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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Chart of Accounts</h1>
                    <p className="text-muted-foreground mt-1">Manage your general ledger accounts and financial structure.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-primary/25 font-medium"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Account
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Accounts</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-blue-500 uppercase">Assets</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.assets}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-red-500 uppercase">Liabilities</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.liabilities}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-purple-500 uppercase">Equity</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.equity}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-green-500 uppercase">Income</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.income}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-orange-500 uppercase">Expenses</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.expenses}</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
                    <div className="relative w-full sm:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by code, name, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full sm:w-40"
                            icon={<FilterIcon className="w-4 h-4" />}
                        >
                            <option value="All">All Types</option>
                            {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${account.type === 'Asset' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                                account.type === 'Liability' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                                                    account.type === 'Equity' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                                        account.type === 'Income' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                                                            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                                            }`}>
                                            {account.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{account.subtype || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${account.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                            {account.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(account)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteAccount(account.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
                                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <SearchIcon className="w-8 h-8 opacity-20" />
                                            <p>No accounts found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h2 className="text-xl font-bold text-foreground">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Enter the details for this general ledger account.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code || ''}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Type</label>
                                    <Select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full"
                                    >
                                        {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="e.g. Cash on Hand"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Subtype (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.subtype || ''}
                                    onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="e.g. Current Assets"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer select-none">Active Account</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-md hover:shadow-lg"
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
