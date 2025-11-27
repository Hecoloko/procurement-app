
import React, { useRef, useEffect } from 'react';
import { Order, CommunicationThread, Message, AdminUser } from '../types';
import MessageInput from './MessageInput';
import ChatMessage from './ChatMessage';

interface OrderCommunicationProps {
    order: Order;
    thread: CommunicationThread | null;
    messages: Message[];
    users: AdminUser[];
    currentUser: AdminUser;
    onSendMessage: (orderId: string, content: string, taggedUserIds?: string[]) => void;
    orders: Order[];
    onSelectOrder: (order: Order) => void;
}

const OrderCommunication: React.FC<OrderCommunicationProps> = ({ order, thread, messages, users, currentUser, onSendMessage, orders, onSelectOrder }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (content: string, taggedUserIds?: string[]) => {
        onSendMessage(order.id, content, taggedUserIds);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-b-lg">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length > 0 ? (
                    messages.map(msg => {
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
                            />
                        );
                    })
                ) : (
                    <div className="text-center text-sm text-gray-500 py-10">
                        <p>No messages yet.</p>
                        <p>Start the conversation about this order.</p>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
                <MessageInput users={users} orders={orders} onSendMessage={handleSend} />
            </div>
        </div>
    );
};

export default OrderCommunication;