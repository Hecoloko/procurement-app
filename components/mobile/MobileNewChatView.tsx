

import React, { useState, useMemo } from 'react';
import { AdminUser } from '../../types';
import { SearchIcon, XMarkIcon, ChevronLeftIcon, PaperAirplaneIcon } from '../Icons';

interface MobileNewChatViewProps {
    users: AdminUser[];
    currentUser: AdminUser;
    onStartThread: (participantIds: string[], initialMessage: string) => Promise<void>;
    onCancel: () => void;
}

const MobileNewChatView: React.FC<MobileNewChatViewProps> = ({ users, currentUser, onStartThread, onCancel }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [initialMessage, setInitialMessage] = useState('');

    const otherUsers = useMemo(() => users.filter(u => u.id !== currentUser.id), [users, currentUser.id]);

    const filteredUsers = useMemo(() => {
        return otherUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [otherUsers, searchQuery]);

    const selectedUsers = useMemo(() => {
        return otherUsers.filter(u => selectedUserIds.has(u.id));
    }, [otherUsers, selectedUserIds]);

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };
    
    const handleStartClick = async () => {
        if (selectedUserIds.size > 0 && initialMessage.trim()) {
            await onStartThread(Array.from(selectedUserIds), initialMessage.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-[#121212] z-60 flex flex-col font-sans">
            <header className="p-4 border-b border-gray-800 bg-[#1E1E1E]/80 backdrop-blur-sm flex items-center gap-3 sticky top-0">
                <button onClick={onCancel} className="p-1 -ml-2 text-gray-300">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-white">New Message</h1>
            </header>

            <div className="p-4 space-y-3">
                <div className="relative">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                    <input 
                        type="text"
                        placeholder="Search for people..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-[#2C2C2E] text-white focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <div key={user.id} className="flex items-center gap-1.5 bg-gray-600 rounded-full pl-3 pr-1 py-1">
                                <span className="text-sm font-medium text-white">{user.name}</span>
                                <button onClick={() => handleUserToggle(user.id)} className="text-gray-300 hover:text-white"><XMarkIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <main className="flex-1 overflow-y-auto border-t border-gray-800">
                 {filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border-b border-gray-800 hover:bg-[#1E1E1E]">
                        <input
                            type="checkbox"
                            id={`user-select-${user.id}`}
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-600 focus:ring-offset-gray-800"
                        />
                        <label htmlFor={`user-select-${user.id}`} className="flex items-center gap-3 cursor-pointer w-full">
                             <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-white">{user.name}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                        </label>
                    </div>
                 ))}
            </main>

            <footer className="p-2 border-t border-gray-800 bg-[#1E1E1E] sticky bottom-0">
                 <div className="flex items-center gap-2">
                    <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#2C2C2E] text-white focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                        rows={1}
                        style={{maxHeight: '100px'}}
                    />
                    <button 
                        onClick={handleStartClick}
                        disabled={selectedUserIds.size === 0 || !initialMessage.trim()}
                        className="p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-600 transition-colors"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MobileNewChatView;