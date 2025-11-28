import React from 'react';
import { Message, AdminUser, Order } from '../types';

interface ChatMessageProps {
    message: Message;
    sender: AdminUser;
    isCurrentUser: boolean;
    users: AdminUser[];
    orders: Order[];
    onSelectOrder: (order: Order) => void;
    theme?: 'light' | 'dark';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, sender, isCurrentUser, users, orders, onSelectOrder, theme = 'light' }) => {

    const renderContent = (content: string) => {
        const parts = content.split(/(@[a-zA-Z\s]+|#ord-[\w-]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const userName = part.substring(1).trim();
                const user = users.find(u => u.name === userName);
                if (user) {
                    return <strong key={index} className="text-blue-500 font-semibold">{part}</strong>;
                }
            }
            if (part.startsWith('#')) {
                const orderId = part.substring(1);
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    return (
                        <button
                            key={index}
                            onClick={() => onSelectOrder(order)}
                            className="text-indigo-500 font-semibold hover:underline"
                        >
                            {part}
                        </button>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    };

    const bubbleClasses = isCurrentUser
        ? 'bg-green-500 text-white rounded-br-lg'
        : 'bg-gray-200 text-gray-800 dark:bg-[#2C2C2E] dark:text-white rounded-bl-lg';

    const senderNameClasses = 'text-xs font-bold mb-1 opacity-70 dark:text-gray-400 dark:opacity-100';

    return (
        <div className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
            {!isCurrentUser && <img src={sender.avatarUrl} alt={sender.name} className="w-8 h-8 rounded-full flex-shrink-0" />}
            <div className={`max-w-md p-3 rounded-2xl ${bubbleClasses}`}>
                {!isCurrentUser && <p className={senderNameClasses}>{sender.name}</p>}
                <p className="text-sm whitespace-pre-wrap">{renderContent(message.content)}</p>
            </div>
        </div>
    );
};

export default ChatMessage;