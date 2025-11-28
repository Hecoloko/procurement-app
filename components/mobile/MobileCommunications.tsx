



import React, { useState, useMemo, useEffect } from 'react';
import { CommunicationThread, Message, AdminUser, Order } from '../../types';
import { PlusIcon } from '../Icons';
import MobileChatView from './MobileChatView';
import MobileNewChatView from './MobileNewChatView';

interface MobileCommunicationsProps {
    threads: CommunicationThread[];
    messages: Message[];
    users: AdminUser[];
    orders: Order[];
    currentUser: AdminUser;
    onSendMessage: (threadId: string, content: string, taggedUserIds?: string[]) => void;
    onStartNewThread: (participantIds: string[]) => Promise<string>;
    setIsInsideMessageView: (isInside: boolean) => void;
}

const MobileCommunications: React.FC<MobileCommunicationsProps> = (props) => {
    const [view, setView] = useState<'list' | 'new'>('list');
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    useEffect(() => {
        const isDeepView = view === 'new' || selectedThreadId !== null;
        props.setIsInsideMessageView(isDeepView);
    }, [view, selectedThreadId, props.setIsInsideMessageView]);

    const selectedThread = useMemo(() => {
        return props.threads.find(t => t.id === selectedThreadId);
    }, [selectedThreadId, props.threads]);

    const getThreadTitle = (thread: CommunicationThread) => {
        if (thread.orderId) {
            const order = props.orders?.find(o => o.id === thread.orderId);
            return order?.cartName || `Order ${thread.orderId}`;
        }
        return thread.subject || 'Conversation';
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
    };

    const handleStartThread = async (participantIds: string[], initialMessage: string) => {
        const newThreadId = await props.onStartNewThread(participantIds);
        props.onSendMessage(newThreadId, initialMessage);
        setView('list');
        setSelectedThreadId(newThreadId);
    };

    if (view === 'new') {
        return (
            <MobileNewChatView
                users={props.users}
                currentUser={props.currentUser}
                onCancel={() => setView('list')}
                onStartThread={handleStartThread}
            />
        );
    }

    if (selectedThread) {
        const threadMessages = props.messages.filter(m => m.threadId === selectedThread.id);
        return (
            <MobileChatView
                thread={selectedThread}
                messages={threadMessages}
                users={props.users}
                orders={props.orders}
                currentUser={props.currentUser}
                onSendMessage={props.onSendMessage}
                onBack={() => setSelectedThreadId(null)}
            />
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Messages</h1>
                <button onClick={() => setView('new')} title="New Chat" className="p-2 text-green-400 bg-[#2C2C2E] rounded-full">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-3">
                {props.threads.map(thread => (
                    <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className="w-full text-left bg-[#1E1E1E] p-4 rounded-xl shadow-lg border border-gray-800 flex justify-between items-start gap-3 transition-transform active:scale-95">
                        <div className="flex-grow min-w-0">
                            <h2 className="font-bold text-white truncate">{getThreadTitle(thread)}</h2>
                            <p className="text-sm text-gray-400 mt-1 truncate">{thread.lastMessageSnippet}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end">
                            <time className="text-xs text-gray-500">{getTimeAgo(thread.lastMessageTimestamp)}</time>
                            {!thread.isRead && <span className="mt-2 w-2.5 h-2.5 bg-green-500 rounded-full"></span>}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileCommunications;