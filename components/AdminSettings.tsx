
// ... (imports remain unchanged)
import React, { useState, useMemo, useEffect } from 'react';
import { AdminUser, Role, ApprovalRule, NotificationSetting, AppModule, PermissionAction, Permission, Vendor, Property, Unit, PermissionSet, Company, Product } from '../types';
import { UserGroupIcon, ShieldCheckIcon, ArrowPathIcon, BellIcon, PlusIcon, TrashIcon, PencilIcon, BuildingOfficeIcon, XMarkIcon, ArrowUpTrayIcon, EyeIcon, SunIcon, CheckBadgeIcon } from './Icons';
import CreateRoleModal from './CreateRoleModal';
import AddUserModal from './AddUserModal';
import AddCompanyModal from './AddCompanyModal';
import { ThemeSwitcher } from './ThemeSwitcher';
import { usePermissions } from '../contexts/PermissionsContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// ... (all constants, sub-components like TabButton, AddPropertyModal, etc. remain unchanged)
const initialApprovalRules: ApprovalRule[] = [
    { id: 'rule-1', name: 'Maintenance over $500', conditions: { amountMin: 500, glCategories: ['Maintenance'] }, steps: [{ roleId: 'role-2' }] },
    { id: 'rule-2', name: 'All IT Spend', conditions: { glCategories: ['IT & Software'], vendors: ['vendor-3'] }, steps: [{ roleId: 'role-2' }, { roleId: 'role-1' }] },
];

const dummyNotifications: NotificationSetting[] = [
    { id: 'cartSubmission', label: 'Cart Submission', email: true, sms: false, push: true },
    { id: 'approvalRequest', label: 'Approval Request', email: true, sms: true, push: true },
    { id: 'finalApproval', label: 'Final Approval', email: true, sms: false, push: false },
    { id: 'purchase', label: 'Purchase Made', email: false, sms: false, push: true },
    { id: 'reception', label: 'Order Received', email: true, sms: false, push: true },
]

const TabButton: React.FC<{ icon: React.FC<any>, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 w-full text-left whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-white/20 text-white shadow-md border border-white/10' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span>{label}</span>
    </button>
);

const AddPropertyModal: React.FC<{ onClose: () => void; onSave: (data: { name: string; userIds: string[] }) => void; users: AdminUser[] }> = ({ onClose, onSave, users }) => {
    const [name, setName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Add New Property</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="propName" className="block text-sm font-medium mb-1">Property Name *</label>
                        <input
                            type="text"
                            id="propName"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Assign Users</label>
                        <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => toggleUser(user.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary mr-3"
                                    />
                                    <span className="text-sm">{user.name}</span>
                                </div>
                            ))}
                            {users.length === 0 && <p className="text-sm text-muted-foreground p-2">No users available.</p>}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                    <button onClick={() => { if (name.trim()) { onSave({ name: name.trim(), userIds: selectedUserIds }); onClose(); } }} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:bg-muted disabled:text-muted-foreground" disabled={!name.trim()}>Save Property</button>
                </div>
            </div>
        </div>
    );
};

const AddUnitModal: React.FC<{ onClose: () => void; onSave: (data: { name: string }) => void; propertyName: string }> = ({ onClose, onSave, propertyName }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Add Unit to {propertyName}</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="unitName" className="block text-sm font-medium mb-1">Unit Name / Identifier *</label>
                        <input
                            type="text"
                            id="unitName"
                            placeholder="e.g., Suite 101, Apt 2B, Lobby"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                    <button onClick={() => { if (name.trim()) { onSave({ name: name.trim() }); onClose(); } }} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:bg-muted disabled:text-muted-foreground" disabled={!name.trim()}>Save Unit</button>
                </div>
            </div>
        </div>
    );
};

const BulkImportModal: React.FC<{ onClose: () => void; type: 'Properties' | 'Units' }> = ({ onClose, type }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-border text-foreground" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Bulk Import {type}</h2>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Paste your data here. Each {type === 'Properties' ? 'property' : 'unit'} name should be on a new line.</p>
                <p className="text-xs text-muted-foreground font-mono p-3 bg-muted rounded-lg border border-border">
                    Example:<br />
                    {type === 'Properties' ? 'Downtown Office\nSuburban Warehouse' : 'Suite 101\nSuite 102\nFloor 2'}
                </p>
                <textarea
                    rows={8}
                    className="mt-4 block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground outline-none transition-all resize-none"
                ></textarea>
            </div>
            <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-all duration-200 text-sm">Cancel</button>
                <button onClick={onClose} className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 text-sm border border-transparent">Import Data</button>
            </div>
        </div>
    </div>
);

const UserAvatar: React.FC<{ name: string; url: string }> = ({ name, url }) => {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&bold=true`;
    const [src, setSrc] = useState(() => {
        if (!url || url === '' || url.includes('via.placeholder.com')) return fallback;
        return url;
    });

    useEffect(() => {
        if (!url || url === '' || url.includes('via.placeholder.com')) {
            setSrc(fallback);
        } else {
            setSrc(url);
        }
    }, [url, name]);

    return (
        <div className="relative mr-4">
            <img
                src={src}
                alt={name}
                className="w-10 h-10 rounded-full border-2 border-border shadow-sm object-cover bg-muted"
                onError={() => setSrc(fallback)}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm"></div>
        </div>
    );
};

const UserSettings: React.FC<{
    users: AdminUser[];
    roles: Role[];
    currentUser: AdminUser;
    onViewAsUser: (user: AdminUser) => void;
    onAddUserClick: () => void;
    onDeleteUser: (userId: string) => void;
    properties: Property[];
}> = ({ users, roles, currentUser, onViewAsUser, onAddUserClick, onDeleteUser, properties }) => {
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false, id: '', name: ''
    });

    const handleDeleteClick = (user: AdminUser) => {
        setDeleteModal({ isOpen: true, id: user.id, name: user.name });
    };

    const confirmDelete = () => {
        onDeleteUser(deleteModal.id);
    };

    return (
        <div>
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteModal.name}"? This will remove their profile from the system.`}
                itemType="User"
            />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                <button onClick={onAddUserClick} className="flex items-center bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add User
                </button>
            </div>

            <div className="relative group rounded-2xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

                <div className="relative bg-card backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left font-bold tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left font-bold tracking-wider">Properties</th>
                                    <th className="px-6 py-4 text-center font-bold tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center font-bold tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-muted/40 transition-colors group/row">
                                        <td className="px-6 py-4 flex items-center">
                                            <UserAvatar name={user.name} url={user.avatarUrl} />
                                            <div>
                                                <div className="font-bold text-foreground">{user.name}</div>
                                                <div className="text-muted-foreground text-xs">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">
                                            {roles?.find(r => r.id === user.roleId)?.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {user.propertyIds.length > 0
                                                ? user.propertyIds.map(pid => properties?.find(p => p.id === pid)?.name).filter(Boolean).join(', ')
                                                : <span className="italic text-muted-foreground/50">No properties</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${user.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1 opacity-70 group-hover/row:opacity-100 transition-opacity">
                                                {currentUser.roleId === 'role-1' && user.id !== currentUser.id && (
                                                    <button onClick={() => onViewAsUser(user)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title={`View as ${user.name}`}>
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                                {user.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (Remaining components: RolesSettings, ApprovalWorkflowsSettings, NotificationsSettings, PropertiesSettings, CompanySettings, AdminSettings remain unchanged in structure)
// Paste the rest of the file here as in the previous context, just updating UserSettings above.

interface RolesSettingsProps {
    roles: Role[];
    onAddRole: (roleData: Omit<Role, 'id'>) => void;
    onUpdateRole: (roleData: Role) => void;
    onDeleteRole: (roleId: string) => void;
}

const RolesSettings: React.FC<RolesSettingsProps> = ({ roles, onAddRole, onUpdateRole, onDeleteRole }) => {
    const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
    const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
    const modules: { id: AppModule, name: string }[] = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'carts', name: 'Carts' },
        { id: 'approvals', name: 'Approvals' },
        { id: 'orders', name: 'Orders' },
        { id: 'purchaseOrders', name: 'Purchase Orders' },
        { id: 'receiving', name: 'Receiving' },
        { id: 'reports', name: 'Reports' },
        { id: 'suppliers', name: 'Suppliers' },
        { id: 'settings', name: 'Settings' }
    ];
    const actions: PermissionAction[] = ['view', 'create', 'edit', 'approve', 'delete', 'procure'];

    useEffect(() => {
        if (!selectedRole || !roles?.find(r => r.id === selectedRole.id)) {
            setSelectedRole(roles[0] || null);
        }
    }, [roles, selectedRole]);

    const handlePermissionChange = (module: AppModule, action: PermissionAction, isChecked: boolean) => {
        if (!selectedRole) return;
        let newPermissions = new Set(selectedRole.permissions);
        const currentPermission: Permission = `${module}:${action}`;
        if (isChecked) {
            newPermissions.add(currentPermission);
            if (action !== 'view' && !newPermissions.has(`${module}:view`)) {
                newPermissions.add(`${module}:view`);
            }
        } else {
            newPermissions.delete(currentPermission);
            if (action === 'view') {
                Array.from(newPermissions).forEach(p => {
                    if ((p as string).startsWith(`${module}:`)) {
                        newPermissions.delete(p);
                    }
                });
            }
        }
        onUpdateRole({ ...selectedRole, permissions: Array.from(newPermissions).sort() });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Roles & Permissions</h2>
                <button onClick={() => setIsCreateRoleModalOpen(true)} className="flex items-center bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> Create Role
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-card/50 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-border">
                    <h3 className="font-semibold text-muted-foreground p-2 uppercase text-xs tracking-wider">Roles</h3>
                    <ul className="space-y-1">
                        {roles.map(role => (
                            <li key={role.id}>
                                <button onClick={() => setSelectedRole(role)} className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedRole?.id === role.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-foreground/70 hover:bg-muted hover:text-foreground'}`}>
                                    <span className="font-bold">{role.name}</span>
                                    <p className="text-xs font-normal text-muted-foreground mt-0.5 truncate">{role.description}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2 bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-border">
                    {selectedRole ? (
                        <>
                            <h3 className="text-lg font-bold text-foreground mb-4">Permissions for {selectedRole.name}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Module</th>
                                            {actions.map(action => (
                                                <th key={action} className="px-2 py-3 text-center capitalize">{action}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {modules.map(module => (
                                            <tr key={module.id} className="hover:bg-muted transition-colors">
                                                <td className="px-4 py-3 font-semibold text-foreground">{module.name}</td>
                                                {actions.map(action => (
                                                    <td key={action} className="px-2 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                                            checked={selectedRole.permissions.includes(`${module.id}:${action}`)}
                                                            onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground h-full flex items-center justify-center">Select or create a role to view its permissions.</p>
                    )}
                </div>
            </div>
            <CreateRoleModal
                isOpen={isCreateRoleModalOpen}
                onClose={() => setIsCreateRoleModalOpen(false)}
                onSave={(roleData) => {
                    onAddRole(roleData);
                    setIsCreateRoleModalOpen(false);
                }}
            />
        </div>
    );
};

const ApprovalWorkflowsSettings: React.FC = () => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Approval Workflows</h2>
                <button className="flex items-center bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> Create Rule
                </button>
            </div>
            <div className="space-y-4">
                {initialApprovalRules.map(rule => (
                    <div key={rule.id} className="bg-card/50 backdrop-blur-md p-5 rounded-xl border border-border flex justify-between items-center hover:bg-muted transition-colors">
                        <div>
                            <h3 className="font-bold text-foreground text-lg">{rule.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {Object.entries(rule.conditions).map(([key, value]) => `${key.replace('Min', ' minimum')}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' & ')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-muted rounded-lg transition-colors"><PencilIcon className="w-5 h-5" /></button>
                            <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-muted rounded-lg transition-colors"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotificationsSettings: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Notification Settings</h2>
            <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-border">
                <p className="text-sm text-muted-foreground mb-6">Configure which notifications are sent via email, SMS, or in-app push.</p>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        <span className="col-span-1">Event</span>
                        <span className="col-span-1 text-center">Email</span>
                        <span className="col-span-1 text-center">SMS</span>
                        <span className="col-span-1 text-center">Push</span>
                    </div>
                    {/* Rows */}
                    {dummyNotifications.map(setting => (
                        <div key={setting.id} className="grid grid-cols-4 gap-4 items-center border-t border-border pt-4 px-2 hover:bg-muted rounded-lg transition-colors">
                            <span className="font-semibold text-foreground">{setting.label}</span>
                            <div className="text-center"><input type="checkbox" defaultChecked={setting.email} className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" /></div>
                            <div className="text-center"><input type="checkbox" defaultChecked={setting.sms} className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" /></div>
                            <div className="text-center"><input type="checkbox" defaultChecked={setting.push} className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" /></div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all duration-200 active:scale-95">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

interface PropertiesSettingsProps {
    properties: Property[];
    units: Unit[];
    onAddProperty: (propertyData: { name: string; userIds: string[] }) => void;
    onAddUnit: (unitData: { propertyId: string; name: string; }) => void;
    onDeleteProperty: (propertyId: string) => void;
}
const PropertiesSettings: React.FC<PropertiesSettingsProps & { users: AdminUser[] }> = ({ properties, units, onAddProperty, onAddUnit, users, onDeleteProperty }) => {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(properties.length > 0 ? properties[0] : null);
    const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);
    const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
    const [isBulkImportPropsOpen, setIsBulkImportPropsOpen] = useState(false);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false, id: '', name: ''
    });

    useEffect(() => {
        if (!selectedProperty && properties.length > 0) {
            setSelectedProperty(properties[0]);
        }
    }, [properties, selectedProperty]);


    const selectedPropertyUnits = useMemo(() => {
        if (!selectedProperty) return [];
        return units.filter(u => u.propertyId === selectedProperty.id);
    }, [units, selectedProperty]);

    const handleAddUnitSave = (data: { name: string }) => {
        if (selectedProperty) {
            onAddUnit({ propertyId: selectedProperty.id, name: data.name });
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, prop: Property) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, id: prop.id, name: prop.name });
    };

    const confirmDelete = () => {
        onDeleteProperty(deleteModal.id);
        if (selectedProperty?.id === deleteModal.id) {
            setSelectedProperty(null);
        }
    };

    return (
        <div>
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Delete Property"
                message={`Are you sure you want to delete "${deleteModal.name}"? This will also delete all associated units and data.`}
                itemType="Property"
            />

            <h2 className="text-2xl font-bold text-foreground mb-6">Properties & Units</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-card/50 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-border">
                    <h3 className="font-semibold text-muted-foreground p-2 text-xs uppercase tracking-wider">Properties ({properties.length})</h3>
                    <ul className="space-y-1 mb-3 max-h-96 overflow-y-auto scrollbar-thin pr-1">
                        {properties.map(prop => (
                            <li key={prop.id} className="group relative">
                                <button onClick={() => setSelectedProperty(prop)} className={`w-full text-left p-3 rounded-lg font-semibold transition-all duration-200 text-sm ${selectedProperty?.id === prop.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-foreground/70 hover:bg-muted hover:text-foreground'}`}>
                                    {prop.name}
                                </button>
                                <button
                                    onClick={(e) => handleDeleteClick(e, prop)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Property"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="pt-4 border-t border-border space-y-2">
                        <button onClick={() => setIsAddPropModalOpen(true)} className="flex items-center gap-2 w-full text-sm font-semibold text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors"><PlusIcon className="w-5 h-5" /> Add Property</button>
                        <button onClick={() => setIsBulkImportPropsOpen(true)} className="flex items-center gap-2 w-full text-sm font-semibold text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-muted transition-colors"><ArrowUpTrayIcon className="w-5 h-5" /> Bulk Import</button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-border">
                    {selectedProperty ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-foreground">Units for {selectedProperty.name}</h3>
                                <button onClick={() => setIsAddUnitModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 px-3 py-1.5 rounded-lg transition-colors shadow-md active:scale-95"><PlusIcon className="w-5 h-5" /> Add Unit</button>
                            </div>
                            {selectedPropertyUnits.length > 0 ? (
                                <ul className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
                                    {selectedPropertyUnits.map(unit => (
                                        <li key={unit.id} className="py-3 px-2 hover:bg-muted text-foreground rounded-lg transition-colors">{unit.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No units added for this property.</p>
                            )}
                        </>
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">Select a property to view its units.</p>
                    )}
                </div>
            </div>
            {isAddPropModalOpen && <AddPropertyModal onClose={() => setIsAddPropModalOpen(false)} onSave={onAddProperty} users={users} />}
            {isAddUnitModalOpen && selectedProperty && <AddUnitModal onClose={() => setIsAddUnitModalOpen(false)} onSave={handleAddUnitSave} propertyName={selectedProperty.name} />}
            {isBulkImportPropsOpen && <BulkImportModal onClose={() => setIsBulkImportPropsOpen(false)} type="Properties" />}
        </div>
    );
};

const CompanySettings: React.FC<{
    companies: Company[];
    onAddCompany: (companyData: { name: string }, userData: { name: string; email: string; password: string; roleId: string }) => void;
    roles: Role[];
}> = ({ companies, onAddCompany, roles }) => {
    const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

    const handleSaveCompany = (companyData: { name: string }, userData: { name: string; email: string; password: string; roleId: string }) => {
        onAddCompany(companyData, userData);
        setIsAddCompanyModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Company Management</h2>
                <button onClick={() => setIsAddCompanyModalOpen(true)} className="flex items-center bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Company
                </button>
            </div>
            <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-3 text-left">Company Name</th>
                            <th className="px-6 py-3 text-left">ID</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {companies.map(company => (
                            <tr key={company.id} className="hover:bg-muted transition-colors">
                                <td className="px-6 py-4 font-semibold text-foreground">{company.name}</td>
                                <td className="px-6 py-4 font-mono text-muted-foreground">{company.id}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-muted rounded-lg transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                        <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-muted rounded-lg transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {companies.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">No companies found.</div>
                )}
            </div>
            <AddCompanyModal
                isOpen={isAddCompanyModalOpen}
                onClose={() => setIsAddCompanyModalOpen(false)}
                onSave={handleSaveCompany}
                roles={roles}
            />
        </div>
    )
}


interface DataManagementSettingsProps {
    products: Product[];
    vendors: Vendor[];
    onUpdateProduct: (product: Product) => void;
}

const DataManagementSettings: React.FC<DataManagementSettingsProps> = ({ products, vendors, onUpdateProduct }) => {
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const unassignedProducts = useMemo(() => products.filter(p => !p.vendorId), [products]);

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedProductIds(newSet);
    };

    const handleSelectAll = () => {
        if (unassignedProducts.length === 0) return; // No products to select
        if (selectedProductIds.size === unassignedProducts.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(unassignedProducts.map(p => p.id)));
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedVendorId || selectedProductIds.size === 0) return;
        setIsAssigning(true);

        // Process updates sequentially to ensure state stability
        for (const productId of selectedProductIds) {
            const product = products.find(p => p.id === productId);
            if (product) {
                await onUpdateProduct({ ...product, vendorId: selectedVendorId });
            }
        }

        setIsAssigning(false);
        setSelectedProductIds(new Set());
        setSelectedVendorId('');
        alert(`Successfully assigned ${selectedProductIds.size} products to vendor.`);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Data Management</h2>

            <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-border mb-8">
                <h3 className="text-lg font-bold text-foreground mb-4">Bulk Assign Vendors</h3>
                <p className="text-sm text-muted-foreground mb-6">Found {unassignedProducts.length} products without an assigned vendor. Select products and a vendor to bulk assign.</p>

                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium mb-1 text-foreground">Assign to Vendor</label>
                        <select
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            className="block w-full px-4 py-2.5 bg-background border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Select a vendor...</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleBulkAssign}
                        disabled={!selectedVendorId || selectedProductIds.size === 0 || isAssigning}
                        className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all duration-200 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                    >
                        {isAssigning ? 'Assigning...' : `Assign to ${selectedProductIds.size} Products`}
                    </button>
                </div>

                <div className="bg-background rounded-xl border border-border overflow-hidden max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 text-center w-16">
                                    <input
                                        type="checkbox"
                                        checked={unassignedProducts.length > 0 && selectedProductIds.size === unassignedProducts.length}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left">Product Name</th>
                                <th className="px-6 py-3 text-left">SKU</th>
                                <th className="px-6 py-3 text-left">Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {unassignedProducts.length > 0 ? unassignedProducts.map(product => (
                                <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductIds.has(product.id)}
                                            onChange={() => handleToggleSelect(product.id)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{product.sku}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{product.primaryCategory}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <CheckBadgeIcon className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                                        <p>All products have assigned vendors!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface AdminSettingsProps {
    vendors: Vendor[];
    properties: Property[];
    units: Unit[];
    users: AdminUser[];
    roles: Role[];
    companies?: Company[];
    currentUser: AdminUser;
    onAddProperty: (propertyData: { name: string; userIds: string[] }) => void;
    onAddUnit: (unitData: { propertyId: string; name: string; }) => void;
    onAddRole: (roleData: Omit<Role, 'id'>) => void;
    onUpdateRole: (roleData: Role) => void;
    onDeleteRole: (roleId: string) => void;
    onViewAsUser: (user: AdminUser) => void;
    onAddUser: (userData: { name: string; email: string; password?: string; roleId: string; propertyIds: string[]; sendInvite?: boolean }) => void;
    onAddCompany?: (companyData: { name: string }, userData: { name: string; email: string; password: string; roleId: string }) => void;
    onDeleteUser: (userId: string) => void;
    onDeleteProperty: (propertyId: string) => void;
    products?: Product[];
    onUpdateProduct?: (product: Product) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ vendors, properties, units, users, onAddProperty, onAddUnit, roles, currentUser, onAddRole, onUpdateRole, onDeleteRole, onViewAsUser, onAddUser, companies, onAddCompany, onDeleteUser, onDeleteProperty, products, onUpdateProduct }) => {
    const [activeTab, setActiveTab] = useState('users');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    const isOwner = currentUser.roleId === 'role-0';
    const { can } = usePermissions();

    const baseTabs = [
        { id: 'users', label: 'User Management', icon: UserGroupIcon, permission: 'users:view' },
        { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheckIcon, permission: 'roles:view' },
        { id: 'workflows', label: 'Approval Workflows', icon: ArrowPathIcon, permission: 'workflows:view' },
        { id: 'notifications', label: 'Notifications', icon: BellIcon, permission: 'notifications:view' },
        { id: 'properties', label: 'Properties & Units', icon: BuildingOfficeIcon, permission: 'companyProperties:view' },
        { id: 'appearance', label: 'Appearance', icon: SunIcon, permission: 'settings:view' },
        { id: 'data', label: 'Data Management', icon: ArrowUpTrayIcon, permission: 'settings:view' },
    ];

    const tabs = useMemo(() => {
        let allTabs = [...baseTabs];
        if (isOwner && onAddCompany) {
            allTabs.splice(1, 0, { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon, permission: 'settings:view' });
        }
        return allTabs.filter(tab => can(tab.permission as any));
    }, [isOwner, onAddCompany, can]);

    useEffect(() => {
        if (tabs.length > 0 && !tabs?.find(t => t.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);


    const handleSaveUser = (userData: { name: string; email: string; password?: string; roleId: string; propertyIds: string[]; sendInvite?: boolean }) => {
        onAddUser(userData);
        setIsAddUserModalOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <UserSettings users={users} roles={roles} currentUser={currentUser} onViewAsUser={onViewAsUser} onAddUserClick={() => setIsAddUserModalOpen(true)} onDeleteUser={onDeleteUser} properties={properties} />;
            case 'roles': return <RolesSettings roles={roles} onAddRole={onAddRole} onUpdateRole={onUpdateRole} onDeleteRole={onDeleteRole} />;
            case 'workflows': return <ApprovalWorkflowsSettings />;
            case 'notifications': return <NotificationsSettings />;
            case 'properties': return <PropertiesSettings properties={properties} units={units} onAddProperty={onAddProperty} onAddUnit={onAddUnit} users={users} onDeleteProperty={onDeleteProperty} />;
            case 'companies': return companies && onAddCompany ? <CompanySettings companies={companies} onAddCompany={onAddCompany} roles={roles} /> : null;
            case 'appearance': return <ThemeSwitcher />;
            case 'data': return products && onUpdateProduct ? <DataManagementSettings products={products} vendors={vendors} onUpdateProduct={onUpdateProduct} /> : <div className="p-8 text-center text-muted-foreground">Data management features unavailable.</div>;
            default: return null;
        }
    };

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Company Settings</h1>
            <p className="text-muted-foreground mt-2 mb-8">Manage users, roles, permissions, and other system-wide settings.</p>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                        {tabs.map(tab => (
                            <TabButton key={tab.id} icon={tab.icon} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 w-full">
                    {renderContent()}
                </main>
            </div>
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onSave={handleSaveUser}
                roles={roles}
                properties={properties}
            />
        </>
    );
};

export default AdminSettings;
