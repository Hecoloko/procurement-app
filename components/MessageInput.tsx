import React, { useState, useRef } from 'react';
import { AdminUser, Order } from '../types';
import { PaperAirplaneIcon } from './Icons';

interface MessageInputProps {
  users: AdminUser[];
  orders: Order[];
  onSendMessage: (content: string, taggedUserIds?: string[]) => void;
  theme?: 'light' | 'dark';
}

const MessageInput: React.FC<MessageInputProps> = ({ users, orders, onSendMessage, theme = 'light' }) => {
  const [inputValue, setInputValue] = useState('');
  
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const [showOrderSuggestions, setShowOrderSuggestions] = useState(false);
  const [orderQuery, setOrderQuery] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.cartName.toLowerCase().includes(orderQuery.toLowerCase()) || order.id.toLowerCase().includes(orderQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const userMentionMatch = value.match(/@([\w\s]*)$/);
    const orderMentionMatch = value.match(/#([\w\s-]*)$/);

    if (userMentionMatch) {
      setShowUserSuggestions(true);
      setShowOrderSuggestions(false);
      setMentionQuery(userMentionMatch[1]);
    } else if (orderMentionMatch) {
        setShowOrderSuggestions(true);
        setShowUserSuggestions(false);
        setOrderQuery(orderMentionMatch[1]);
    } else {
      setShowUserSuggestions(false);
      setShowOrderSuggestions(false);
    }
  };

  const handleUserSuggestionClick = (userName: string) => {
    const newValue = inputValue.replace(/@([\w\s]*)$/, `@${userName} `);
    setInputValue(newValue);
    setShowUserSuggestions(false);
    inputRef.current?.focus();
  };

  const handleOrderSuggestionClick = (orderId: string) => {
    const newValue = inputValue.replace(/#([\w\s-]*)$/, `#${orderId} `);
    setInputValue(newValue);
    setShowOrderSuggestions(false);
    inputRef.current?.focus();
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Extract tagged user IDs
    const taggedUserIds = users
      .filter(user => inputValue.includes(`@${user.name}`))
      .map(user => user.id);
      
    onSendMessage(inputValue.trim(), taggedUserIds);
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  const textareaClasses = theme === 'dark'
    ? "w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#2C2C2E] text-white focus:ring-green-500 focus:border-green-500 text-sm resize-none"
    : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm resize-none";

  return (
    <div className="relative">
      {showUserSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleUserSuggestionClick(user.name)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium">{user.name}</span>
            </button>
          ))}
        </div>
      )}
      {showOrderSuggestions && filteredOrders.length > 0 && (
         <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredOrders.slice(0, 5).map(order => (
            <button
              key={order.id}
              onClick={() => handleOrderSuggestionClick(order.id)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              <p className="text-sm font-medium">{order.cartName}</p>
              <p className="text-xs text-gray-500">{order.id}</p>
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type message... Use '@' to mention, '#' to link order"
          className={textareaClasses}
          rows={1}
          style={{maxHeight: '100px'}}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-400 transition-colors"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;