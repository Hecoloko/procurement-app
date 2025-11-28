
import React, { useState, useEffect } from 'react';
import { Role, Property } from '../types';
import { XMarkIcon, PaperAirplaneIcon } from './Icons';
import { Select } from './ui/Select';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { name: string; email: string; password?: string; roleId: string; propertyIds: string[]; sendInvite: boolean }) => void;
  roles: Role[];
  properties: Property[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave, roles, properties }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(roles.find(r => r.name === 'Maintenance Tech')?.id || roles[0]?.id || '');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [sendInvite, setSendInvite] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setRoleId(roles.find(r => r.name === 'Maintenance Tech')?.id || roles[0]?.id || '');
      setSelectedPropertyIds(new Set());
      setSendInvite(true);
      setError('');
    }
  }, [isOpen, roles]);

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAllProperties = () => {
    if (selectedPropertyIds.size === properties.length) {
      setSelectedPropertyIds(new Set());
    } else {
      setSelectedPropertyIds(new Set(properties.map(p => p.id)));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !roleId) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    onSave({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      roleId,
      propertyIds: Array.from(selectedPropertyIds),
      sendInvite
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-white/20 text-white" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Add New User</h2>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="Close modal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-md" role="alert">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-white/90 mb-1">Full Name *</label>
                <input
                  type="text"
                  id="userName"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-white/90 mb-1">Email *</label>
                <input
                  type="email"
                  id="userEmail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="userPassword" className="block text-sm font-medium text-white/90 mb-1">Password <span className="text-white/50 font-normal">(Optional)</span></label>
              <input
                type="password"
                id="userPassword"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 chars. Leave empty to only send invite."
                className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-white/30 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="userRole" className="block text-sm font-medium text-white/90 mb-1">Role *</label>
              <Select
                id="userRole"
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                required
                className="bg-white/10 text-white border-white/10 focus:ring-green-500"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id} className="bg-gray-900 text-white">{role.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Assign Properties</label>
              <div className="border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-white/5 custom-scrollbar">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all-properties"
                    checked={properties.length > 0 && selectedPropertyIds.size === properties.length}
                    onChange={handleSelectAllProperties}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="select-all-properties" className="ml-3 text-sm font-medium text-white cursor-pointer">Select All</label>
                </div>
                <hr className="border-white/10" />
                {properties.map(prop => (
                  <div key={prop.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`prop-${prop.id}`}
                      checked={selectedPropertyIds.has(prop.id)}
                      onChange={() => handlePropertyToggle(prop.id)}
                      className="h-4 w-4 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor={`prop-${prop.id}`} className="ml-3 text-sm text-white/80 cursor-pointer">{prop.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="sendInvite"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="h-5 w-5 rounded border-blue-500/50 bg-blue-500/20 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <label htmlFor="sendInvite" className="cursor-pointer">
                <span className="block text-sm font-bold text-white">Send Invitation Email</span>
                <span className="block text-xs text-white/60 mt-1">
                  Automatically open your email client to send a welcome message with a link for the user to set their password.
                </span>
              </label>
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
              className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent flex items-center"
            >
              {sendInvite ? <PaperAirplaneIcon className="w-4 h-4 mr-2" /> : <span className="mr-1"></span>}
              {password ? 'Create Account' : (sendInvite ? 'Add & Invite' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
