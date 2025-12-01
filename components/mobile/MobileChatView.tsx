import React, { useRef, useEffect } from 'react';
import { CommunicationThread, Message, AdminUser, Order } from '../../types';
import { ChevronLeftIcon } from '../Icons';
import MessageInput from '../MessageInput';
import ChatMessage from '../ChatMessage';

interface MobileChatViewProps {
    thread: CommunicationThread;
    messages: Message[];
    users: AdminUser[];
    orders: Order[];
    currentUser: AdminUser;
    onSendMessage: (threadId: string, content: string, taggedUserIds?: string[]) => void;
    onBack: () => void;
}

const MobileChatView: React.FC<MobileChatViewProps> = ({ thread, messages, users, orders, currentUser, onSendMessage, onBack }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (content: string, taggedUserIds?: string[]) => {
        onSendMessage(thread.id, content, taggedUserIds);
    };

    const getThreadTitle = () => {
        if (thread.orderId) {
            const order = orders?.find(o => o.id === thread.orderId);
            return order?.cartName || `Order ${thread.orderId}`;
        }
        return thread.subject || 'Conversation';
    };

    return (
        <div className="fixed inset-0 bg-gray-50 flex flex-col font-sans z-50">
            <header className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center gap-3 sticky top-0 shadow-sm">
                <button onClick={onBack} className="p-1 -ml-2 text-gray-600 hover:text-gray-900">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 truncate">{getThreadTitle()}</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => {
                    const sender = users?.find(u => u.id === msg.senderId);
                    if (!sender) return null;
                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            sender={sender}
                            isCurrentUser={sender.id === currentUser.id}
                            users={users}
                            orders={orders}
                            onSelectOrder={() => { /* Not implemented on mobile */ }}
                            theme="light"
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-2 border-t border-gray-200 bg-white sticky bottom-0">
                <MessageInput users={users} orders={orders} onSendMessage={handleSendMessage} theme="light" />
            </footer>
        </div>
    );
};

export default MobileChatView;