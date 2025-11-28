

import React, { useState, useMemo } from 'react';
import { AdminUser } from '../types';
import { SearchIcon, XMarkIcon } from './Icons';

interface NewChatViewProps {
    users: AdminUser[];
    currentUser: AdminUser;
    onStartThread: (participantIds: string[]) => Promise<void>;
    onCancel: () => void;
}

const NewChatView: React.FC<NewChatViewProps> = ({ users, currentUser, onStartThread, onCancel }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

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
        if (selectedUserIds.size > 0) {
            await onStartThread(Array.from(selectedUserIds));
        }
    };


    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">New Conversation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select participants to start a chat.</p>
            </div>

            <div className="p-4 space-y-3">
                <div className="relative">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search for people..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <div key={user.id} className="flex items-center gap-1.5 bg-gray-200 dark:bg-gray-700 rounded-full pl-2 pr-1 py-0.5">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
                                <button onClick={() => handleUserToggle(user.id)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"><XMarkIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto border-t">
                {filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <input
                            type="checkbox"
                            id={`user-select-${user.id}`}
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`user-select-${user.id}`} className="flex items-center gap-3 cursor-pointer w-full">
                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={onCancel} className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600">Cancel</button>
                <button
                    onClick={handleStartClick}
                    disabled={selectedUserIds.size === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Start Chat ({selectedUserIds.size})
                </button>
            </div>
        </div>
    );
};

export default NewChatView;