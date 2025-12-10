import React, { useEffect } from 'react';
import { CheckBadgeIcon, XMarkIcon } from './Icons';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'success' | 'error' | 'loading' | null;
    title: string;
    message: string;
    autoCloseDuration?: number; // ms
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, status, title, message, autoCloseDuration }) => {
    useEffect(() => {
        if (isOpen && autoCloseDuration && status !== 'loading') {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDuration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, status, autoCloseDuration, onClose]);

    if (!isOpen || !status) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
                className={`bg-card rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center p-8 border text-center transform transition-all scale-100 ${status === 'error' ? 'border-red-500/50' :
                        status === 'success' ? 'border-green-500/50' : 'border-border'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${status === 'error' ? 'bg-red-500/10 text-red-500' :
                        status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                    }`}>
                    {status === 'loading' ? (
                        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : status === 'success' ? (
                        <CheckBadgeIcon className="w-10 h-10" />
                    ) : (
                        <XMarkIcon className="w-10 h-10" />
                    )}
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{message}</p>

                {status !== 'loading' && (
                    <button
                        onClick={onClose}
                        className={`px-8 py-3 rounded-xl font-bold transition-all w-full ${status === 'error' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg' :
                                status === 'success' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 shadow-lg' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            }`}
                    >
                        {status === 'error' ? 'Try Again' : 'Close'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StatusModal;
