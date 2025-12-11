import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types';
import { customerService } from '../../../services/customerService';
import { PlusIcon, SearchIcon, ChevronRightIcon, XMarkIcon } from '../../Icons';

interface CustomerListProps {
    currentCompanyId: string;
}

const AddCustomerModal: React.FC<{ onClose: () => void; onSave: (customer: any) => void; companyId: string }> = ({ onClose, onSave, companyId }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = () => {
        if (!name) return;
        onSave({ name, email, phone, companyId });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Add New Customer</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Name *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full px-4 py-2 bg-background border border-border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-4 py-2 bg-background border border-border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="block w-full px-4 py-2 bg-background border border-border rounded-lg" />
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold">Cancel</button>
                    <button onClick={handleSubmit} disabled={!name} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg">Save Customer</button>
                </div>
            </div>
        </div>
    );
};

const CustomerList: React.FC<CustomerListProps> = ({ currentCompanyId }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, [currentCompanyId]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerService.getCustomers(currentCompanyId);
            setCustomers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (data: any) => {
        try {
            await customerService.createCustomer(data);
            loadCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Property AR</h1>
                    <p className="text-muted-foreground mt-1">Manage accounts receivable for properties and tenants.</p>
                </div>
                <button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg hover:opacity-90 transition-all">
                    <PlusIcon className="w-5 h-5" /> New Account
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Payment Terms</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading customers...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No customers found.</td></tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4 font-bold text-foreground">{customer.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-foreground">{customer.email}</div>
                                            <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{customer.paymentTerms || 'Net 30'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-muted-foreground hover:text-primary transition-colors">
                                                <ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddOpen && <AddCustomerModal onClose={() => setIsAddOpen(false)} onSave={handleAddCustomer} companyId={currentCompanyId} />}
        </div>
    );
};

export default CustomerList;
