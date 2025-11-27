
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CommunicationThread, Message, AdminUser, Order } from '../types';
import { CommunicationIcon, PlusIcon, SearchIcon } from './Icons';
import MessageInput from './MessageInput';
import NewChatView from './NewChatView';
import ChatMessage from './ChatMessage';

const ThreadListItem: React.FC<{
  thread: CommunicationThread;
  users: AdminUser[];
  orders: Order[];
  currentUser: AdminUser;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ thread, users, orders, currentUser, isSelected, onSelect }) => {
    
    const getParticipantNames = () => {
        return thread.participantIds
            .filter(id => id !== currentUser.id)
            .map(id => users.find(u => u.id === id)?.name || 'Unknown User')
            .join(', ');
    };
    
    const getThreadTitle = () => {
        if(thread.orderId) {
            const order = orders.find(o => o.id === thread.orderId);
            return order?.cartName || `Order ${thread.orderId}`;
        }
        return thread.subject || getParticipantNames();
    }
    
    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    return (
        <button onClick={onSelect} className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${isSelected ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
            <div className="flex justify-between items-center">
                <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>{getThreadTitle()}</h3>
                <time className="text-xs text-muted-foreground flex-shrink-0 ml-2">{getTimeAgo(thread.lastMessageTimestamp)}</time>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{thread.lastMessageSnippet}</p>
        </button>
    );
};

interface CommunicationCenterProps {
    threads: CommunicationThread[];
    messages: Message[];
    users: AdminUser[];
    orders: Order[];
    currentUser: AdminUser;
    onSendMessage: (threadId: string, content: string, taggedUserIds?: string[]) => void;
    onStartNewThread: (participantIds: string[]) => Promise<string>;
    onSelectOrder: (order: Order) => void;
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ threads, messages, users, orders, currentUser, onSendMessage, onStartNewThread, onSelectOrder }) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [view, setView] = useState<'chat' | 'new'>('chat');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const filteredThreads = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return threads.filter(thread => {
            const participants = thread.participantIds.map(id => users.find(u => u.id === id)?.name || '').join(' ').toLowerCase();
            const orderInfo = thread.orderId ? (orders.find(o => o.id === thread.orderId)?.cartName || '') : '';
            return participants.includes(lowerQuery) || (thread.subject || '').toLowerCase().includes(lowerQuery) || orderInfo.toLowerCase().includes(lowerQuery);
        });
    }, [threads, users, orders, searchQuery]);

    const selectedThread = useMemo(() => {
        return threads.find(t => t.id === selectedThreadId);
    }, [selectedThreadId, threads]);

    const selectedThreadMessages = useMemo(() => {
        if (!selectedThreadId) return [];
        return messages.filter(m => m.threadId === selectedThreadId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedThreadId, messages]);
    
    useEffect(() => {
        if(selectedThreadMessages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedThreadMessages, selectedThreadId]);

    const handleStartThread = async (participantIds: string[]) => {
        const newThreadId = await onStartNewThread(participantIds);
        setSelectedThreadId(newThreadId);
        setView('chat');
    };

    const handleNewChatClick = () => {
        setView('new');
        setSelectedThreadId(null);
    };

    return (
        <>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Communications</h1>
        <p className="text-muted-foreground mt-2 mb-8">Collaborate with your team on orders and other topics.</p>
        
        <div className="bg-card backdrop-blur-md rounded-2xl shadow-lg border border-border flex h-[70vh] overflow-hidden">
            {/* Thread List */}
            <div className="w-1/3 border-r border-border flex flex-col bg-card">
                <div className="p-4 border-b border-border">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-foreground">Conversations</h2>
                        <button onClick={handleNewChatClick} className="p-2 text-primary hover:bg-muted rounded-full transition-colors" title="New Chat">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    </div>
                     <div className="relative">
                        <SearchIcon className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"/>
                        <input 
                            type="text" 
                            placeholder="Search conversations..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm text-foreground placeholder-muted-foreground transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                    {filteredThreads.map(thread => (
                        <ThreadListItem
                            key={thread.id}
                            thread={thread}
                            users={users}
                            orders={orders}
                            currentUser={currentUser}
                            isSelected={selectedThreadId === thread.id}
                            onSelect={() => {
                                setSelectedThreadId(thread.id);
                                setView('chat');
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Message View */}
            <div className="w-2/3 flex flex-col bg-background/50">
                {view === 'chat' && selectedThread ? (
                    <>
                        <div className="p-4 border-b border-border bg-card backdrop-blur-md">
                             <h3 className="font-bold text-lg text-foreground truncate">
                                {selectedThread.orderId ? orders.find(o => o.id === selectedThread.orderId)?.cartName : selectedThread.subject || 'Conversation'}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                                With: {selectedThread.participantIds.filter(id => id !== currentUser.id).map(id => users.find(u => u.id === id)?.name).join(', ')}
                            </p>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
                            {selectedThreadMessages.map(msg => {
                                const sender = users.find(u => u.id === msg.senderId);
                                if (!sender) return null;
                                return (
                                    <ChatMessage
                                        key={msg.id}
                                        message={msg}
                                        sender={sender}
                                        isCurrentUser={sender.id === currentUser.id}
                                        users={users}
                                        orders={orders}
                                        onSelectOrder={onSelectOrder}
                                        theme="dark" // This prop name is legacy, ChatMessage handles styles based on isCurrentUser mostly
                                    />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-border bg-card">
                            <MessageInput 
                                users={users}
                                orders={orders}
                                onSendMessage={(content, taggedIds) => onSendMessage(selectedThread.id, content, taggedIds)}
                                theme="dark"
                            />
                        </div>
                    </>
                ) : view === 'new' ? (
                    <NewChatView 
                        users={users}
                        currentUser={currentUser}
                        onStartThread={handleStartThread}
                        onCancel={() => setView('chat')}
                    />
                ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                        <CommunicationIcon className="w-20 h-20 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold text-foreground">Select a conversation</h3>
                        <p className="mt-1 text-muted-foreground">Choose a conversation from the left panel to see the messages, or start a new one.</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default CommunicationCenter;
