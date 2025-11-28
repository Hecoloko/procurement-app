
import React, { useState, useEffect } from 'react';
import { Cart, RecurringFrequency } from '../types';
import { XMarkIcon } from './Icons';
import { Select } from './ui/Select';

interface EditScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cartId: string, scheduleData: Partial<Cart>) => void;
    cart: Cart | null;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ isOpen, onClose, onSave, cart }) => {
    // Scheduling state
    const [scheduledDate, setScheduledDate] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
    const [startDate, setStartDate] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
    const [dayOfMonth, setDayOfMonth] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cart) {
            setScheduledDate(cart.scheduledDate || '');
            setFrequency(cart.frequency || 'Monthly');
            setStartDate(cart.startDate || '');
            setDayOfWeek(cart.dayOfWeek || 1);
            setDayOfMonth(cart.dayOfMonth || 1);
            setError(null);
        }
    }, [cart]);

    if (!isOpen || !cart) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const scheduleData: Partial<Cart> = {};

        if (cart.type === 'Scheduled') {
            if (!scheduledDate) { setError('Please select a date.'); return; }
            scheduleData.scheduledDate = scheduledDate;
        }
        if (cart.type === 'Recurring') {
            if (!startDate || !frequency) { setError('Please set a start date and frequency.'); return; }
            scheduleData.startDate = startDate;
            scheduleData.frequency = frequency;
            scheduleData.dayOfWeek = (frequency === 'Weekly' || frequency === 'Bi-weekly') ? dayOfWeek : undefined;
            scheduleData.dayOfMonth = frequency === 'Monthly' ? dayOfMonth : undefined;
        }

        onSave(cart.id, scheduleData);
    };

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-white/20 text-white" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">Edit Schedule for {cart.name}</h2>
                    <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-md" role="alert">{error}</div>}

                        {cart.type === 'Scheduled' && (
                            <div>
                                <label htmlFor="editScheduledDate" className="block text-sm font-medium text-white/90 mb-1">Scheduled Date *</label>
                                <input
                                    type="date"
                                    id="editScheduledDate"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    required
                                    className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all"
                                />
                            </div>
                        )}

                        {cart.type === 'Recurring' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="editFrequency" className="block text-sm font-medium text-white/90 mb-1">Frequency *</label>
                                        <Select
                                            id="editFrequency"
                                            value={frequency}
                                            onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                                            required
                                            className="bg-white/10 text-white border-white/10 focus:ring-green-500"
                                        >
                                            {(['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'] as RecurringFrequency[]).map(f => <option key={f} value={f} className="bg-gray-900 text-white">{f}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <label htmlFor="editStartDate" className="block text-sm font-medium text-white/90 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            id="editStartDate"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            required
                                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {(frequency === 'Weekly' || frequency === 'Bi-weekly') && (
                                    <div>
                                        <label htmlFor="editDayOfWeek" className="block text-sm font-medium text-white/90 mb-1">Day of Week *</label>
                                        <Select
                                            id="editDayOfWeek"
                                            value={dayOfWeek}
                                            onChange={e => setDayOfWeek(Number(e.target.value))}
                                            required
                                            className="bg-white/10 text-white border-white/10 focus:ring-green-500"
                                        >
                                            {daysOfWeek.map((day, i) => <option key={i} value={i} className="bg-gray-900 text-white">{day}</option>)}
                                        </Select>
                                    </div>
                                )}
                                {frequency === 'Monthly' && (
                                    <div>
                                        <label htmlFor="editDayOfMonth" className="block text-sm font-medium text-white/90 mb-1">Day of Month *</label>
                                        <input
                                            type="number"
                                            id="editDayOfMonth"
                                            value={dayOfMonth}
                                            onChange={e => setDayOfMonth(Number(e.target.value))}
                                            min="1"
                                            max="31"
                                            required
                                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
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
                            className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent"
                        >
                            Save Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditScheduleModal;
