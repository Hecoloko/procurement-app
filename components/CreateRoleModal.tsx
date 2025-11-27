
import React, { useState } from 'react';
import { Role, AppModule, PermissionAction, PermissionSet, Permission } from '../types';
import { XMarkIcon } from './Icons';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Omit<Role, 'id'>) => void;
}

const modules: { id: AppModule; name: string }[] = [
    { id: 'dashboard', name: 'Dashboard'},
    { id: 'carts', name: 'Carts'}, 
    { id: 'approvals', name: 'Approvals'}, 
    { id: 'orders', name: 'Orders'},
    { id: 'reports', name: 'Reports'},
    { id: 'suppliers', name: 'Suppliers' },
    { id: 'settings', name: 'Settings'}
];
const actions: PermissionAction[] = ['view', 'create', 'edit', 'approve', 'delete'];


const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<PermissionSet>({});

  if (!isOpen) return null;

  const handlePermissionChange = (module: AppModule, action: PermissionAction, isChecked: boolean) => {
    setPermissions(prev => {
        const currentModulePermissions = prev[module] || [];
        let newModulePermissions;

        if (isChecked) {
            newModulePermissions = [...currentModulePermissions, action];
        } else {
            newModulePermissions = currentModulePermissions.filter(p => p !== action);
        }

        // A "view" permission is implicitly required for other actions
        if (isChecked && action !== 'view' && !newModulePermissions.includes('view')) {
            newModulePermissions.push('view');
        }

        // If "view" is unchecked, no other actions can be permitted
        if (!isChecked && action === 'view') {
            newModulePermissions = [];
        }


        return { ...prev, [module]: newModulePermissions };
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const flatPermissions: Permission[] = Object.entries(permissions).flatMap(
        ([module, actions]) => (actions as PermissionAction[]).map(action => `${module}:${action}` as Permission)
    );
    onSave({ name: name.trim(), description: description.trim(), permissions: flatPermissions });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 text-white" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-tight">Create New Role</h2>
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div>
                    <label htmlFor="roleName" className="block text-sm font-medium text-white/90 mb-1">Role Name *</label>
                    <input 
                        type="text" 
                        id="roleName" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                    />
                </div>
                 <div>
                    <label htmlFor="roleDesc" className="block text-sm font-medium text-white/90 mb-1">Description</label>
                    <textarea 
                        id="roleDesc" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={2} 
                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all resize-none"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Permissions</h3>
                    <div className="overflow-x-auto border border-white/10 rounded-lg bg-white/5">
                        <table className="w-full text-sm text-white">
                            <thead className="text-xs text-white/60 uppercase bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Module</th>
                                    {actions.map(action => (
                                        <th key={action} className="px-2 py-3 text-center capitalize font-semibold">{action}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {modules.map(module => (
                                    <tr key={module.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{module.name}</td>
                                        {actions.map(action => (
                                            <td key={action} className="px-2 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                                                    checked={permissions[module.id]?.includes(action) || false}
                                                    onChange={(e) => handlePermissionChange(module.id, action, e.target.checked)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={!name.trim()} 
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Save Role
                </button>
            </div>
        </div>
    </div>
  );
};

export default CreateRoleModal;
