
import React, { useState } from 'react';
import { Role } from '../types';
import { XMarkIcon } from './Icons';
import { Select } from './ui/Select';

interface AddCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        companyData: { name: string },
        userData: { name: string; email: string; password: string; roleId: string }
    ) => void;
    roles: Role[];
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose, onSave, roles }) => {
    const [companyName, setCompanyName] = useState('');

    // Initial User State
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userRoleId, setUserRoleId] = useState(roles.find(r => r.name === 'Master Admin' || r.name === 'Owner')?.id || roles[0]?.id || '');

    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!companyName.trim()) {
            setError('Company Name is required.');
            return;
        }
        if (!userName.trim() || !userEmail.trim() || !userPassword.trim() || !userRoleId) {
            setError('All user fields are required.');
            return;
        }
        if (userPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        onSave(
            { name: companyName.trim() },
            { name: userName.trim(), email: userEmail.trim(), password: userPassword, roleId: userRoleId }
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-white/20" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">Add New Company</h2>
                    <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-md" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Company Details */}
                        <div>
                            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Company Details</h3>
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-white/90 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    id="companyName"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/50 outline-none transition-all"
                                    placeholder="e.g. Gamma Logistics"
                                />
                            </div>
                        </div>

                        <hr className="border-white/10" />

                        {/* Initial User Details */}
                        <div>
                            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Initial Admin User</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="userName" className="block text-sm font-medium text-white/90 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        id="userName"
                                        value={userName}
                                        onChange={e => setUserName(e.target.value)}
                                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="userEmail" className="block text-sm font-medium text-white/90 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        id="userEmail"
                                        value={userEmail}
                                        onChange={e => setUserEmail(e.target.value)}
                                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="userPassword" className="block text-sm font-medium text-white/90 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        id="userPassword"
                                        value={userPassword}
                                        onChange={e => setUserPassword(e.target.value)}
                                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/50 outline-none transition-all"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="userRole" className="block text-sm font-medium text-white/90 mb-1">Role *</label>
                                    <Select
                                        id="userRole"
                                        value={userRoleId}
                                        onChange={e => setUserRoleId(e.target.value)}
                                        className="bg-white/10 text-white border-white/10 focus:ring-green-500"
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id} className="bg-gray-900 text-white">{role.name}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent"
                        >
                            Create Company
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCompanyModal;
