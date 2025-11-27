
import React, { useState, useEffect } from 'react';
import { Cart, CartType, Property, RecurringFrequency } from '../types';
import { XMarkIcon, CartIcon, RefreshIcon, CalendarIcon, ChevronLeftIcon } from './Icons';
import { CART_CATEGORIES } from '../constants';

interface CreateCartFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Cart> & { type: CartType, propertyId: string }) => { success: boolean; message?: string };
    properties: Property[];
    userName: string;
}

const CartTypeSelection: React.FC<{ onSelect: (type: CartType) => void }> = ({ onSelect }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-white text-center mb-6">Choose a Cart Type</h3>
        <button onClick={() => onSelect('Standard')} className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 group">
            <div className="bg-green-500/20 p-3 rounded-full group-hover:bg-green-500/30 transition-colors"><CartIcon className="w-6 h-6 text-green-400" /></div>
            <div>
                <p className="font-bold text-white text-lg">Standard Cart</p>
                <p className="text-sm text-white/60">For one-time purchases and general procurement needs.</p>
            </div>
        </button>
        <button onClick={() => onSelect('Recurring')} className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 group">
            <div className="bg-blue-500/20 p-3 rounded-full group-hover:bg-blue-500/30 transition-colors"><RefreshIcon className="w-6 h-6 text-blue-400" /></div>
            <div>
                <p className="font-bold text-white text-lg">Recurring Cart</p>
                <p className="text-sm text-white/60">Automate regular orders like monthly office supplies.</p>
            </div>
        </button>
        <button onClick={() => onSelect('Scheduled')} className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 group">
            <div className="bg-purple-500/20 p-3 rounded-full group-hover:bg-purple-500/30 transition-colors"><CalendarIcon className="w-6 h-6 text-purple-400" /></div>
            <div>
                <p className="font-bold text-white text-lg">Scheduled Cart</p>
                <p className="text-sm text-white/60">Prepare a cart for a specific future date or event.</p>
            </div>
        </button>
    </div>
);

const CartDetailsForm: React.FC<{
    cartType: CartType;
    properties: Property[];
    onSubmit: (data: Partial<Cart> & { propertyId: string, category?: string, name: string }) => { success: boolean; message?: string };
    onBack: () => void;
    userName: string;
}> = ({ cartType, properties, onSubmit, onBack, userName }) => {
    const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
    const [workOrderId, setWorkOrderId] = useState('');

    useEffect(() => {
        // Generate Workorder ID on mount
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-4);
        setWorkOrderId(`WO-${timestamp}-${randomSuffix}`);
    }, []);

    useEffect(() => {
        if (properties.length > 0) {
            setPropertyId(properties[0].id);
        } else {
            setPropertyId('');
        }
    }, [properties]);
    const [category, setCategory] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Scheduling state
    const [scheduledDate, setScheduledDate] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
    const [startDate, setStartDate] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
    const [dayOfMonth, setDayOfMonth] = useState(1);

    const needsCategory = cartType === 'Recurring' || cartType === 'Scheduled';

    const generatedName = `${cartType} Cart - ${userName} - ${new Date().toISOString().split('T')[0]} - ${workOrderId}`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!propertyId || (needsCategory && !category)) {
            setError('Please fill in all required fields.');
            return;
        }

        const scheduleData: Partial<Cart> = {};
        if (cartType === 'Scheduled') {
            if (!scheduledDate) { setError('Please select a date for the scheduled cart.'); return; }
            scheduleData.scheduledDate = scheduledDate;
        }
        if (cartType === 'Recurring') {
            if (!startDate || !frequency) { setError('Please set a start date and frequency for the recurring cart.'); return; }
            scheduleData.startDate = startDate;
            scheduleData.frequency = frequency;
            if (frequency === 'Weekly' || frequency === 'Bi-weekly') scheduleData.dayOfWeek = dayOfWeek;
            if (frequency === 'Monthly') scheduleData.dayOfMonth = dayOfMonth;
        }

        const result = onSubmit({ propertyId, ...(needsCategory && { category }), ...scheduleData, name: generatedName });

        if (result && !result.success) {
            setError(result.message || 'An unknown error occurred.');
        }
    };

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-6">
                <button type="button" onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-white">New {cartType} Cart</h3>
            </div>

            {error && <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm mb-6 backdrop-blur-md" role="alert">{error}</div>}

            <div className="space-y-6">
                {/* Auto-generated Name Display */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Cart Name (Auto-Generated)</label>
                    <div className="text-white font-medium break-words">{generatedName}</div>
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-white/40">Work Order ID</span>
                        <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded">{workOrderId}</span>
                    </div>
                </div>

                <div>
                    <label htmlFor="property" className="block text-sm font-medium text-white/90 mb-1">Property *</label>
                    <select
                        id="property"
                        value={propertyId}
                        onChange={e => setPropertyId(e.target.value)}
                        required
                        className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all appearance-none cursor-pointer"
                    >
                        {properties.map(prop => <option key={prop.id} value={prop.id} className="bg-gray-900 text-white">{prop.name}</option>)}
                    </select>
                </div>
                {needsCategory && (
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-white/90 mb-1">Category *</label>
                        <select
                            id="category"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="" disabled className="bg-gray-900 text-gray-400">Select a category</option>
                            {CART_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>)}
                        </select>
                        <p className="text-xs text-white/50 mt-1 ml-1">Only one active {cartType.toLowerCase()} cart is allowed per property and category.</p>
                    </div>
                )}

                {/* --- Scheduling Fields --- */}
                {cartType === 'Scheduled' && (
                    <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-medium text-white/90 mb-1">Scheduled Date *</label>
                        <input
                            type="date"
                            id="scheduledDate"
                            value={scheduledDate}
                            onChange={e => setScheduledDate(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-white outline-none transition-all"
                        />
                    </div>
                )}
                {cartType === 'Recurring' && (
                    <div className="p-5 border border-white/10 rounded-xl bg-white/5 space-y-4">
                        <h4 className="font-bold text-white/90 text-sm uppercase tracking-wider mb-2">Scheduling</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="frequency" className="block text-xs font-medium text-white/70 mb-1">Frequency *</label>
                                <select
                                    id="frequency"
                                    value={frequency}
                                    onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                                    required
                                    className="block w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm focus:ring-green-500 text-white outline-none appearance-none cursor-pointer"
                                >
                                    {(['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'] as RecurringFrequency[]).map(f => <option key={f} value={f} className="bg-gray-900 text-white">{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="startDate" className="block text-xs font-medium text-white/70 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    required
                                    className="block w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm focus:ring-green-500 text-white outline-none"
                                />
                            </div>
                        </div>
                        {(frequency === 'Weekly' || frequency === 'Bi-weekly') && (
                            <div>
                                <label htmlFor="dayOfWeek" className="block text-xs font-medium text-white/70 mb-1">Day of Week *</label>
                                <select
                                    id="dayOfWeek"
                                    value={dayOfWeek}
                                    onChange={e => setDayOfWeek(Number(e.target.value))}
                                    required
                                    className="block w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm focus:ring-green-500 text-white outline-none appearance-none cursor-pointer"
                                >
                                    {daysOfWeek.map((day, i) => <option key={i} value={i} className="bg-gray-900 text-white">{day}</option>)}
                                </select>
                            </div>
                        )}
                        {frequency === 'Monthly' && (
                            <div>
                                <label htmlFor="dayOfMonth" className="block text-xs font-medium text-white/70 mb-1">Day of Month *</label>
                                <input
                                    type="number"
                                    id="dayOfMonth"
                                    value={dayOfMonth}
                                    onChange={e => setDayOfMonth(Number(e.target.value))}
                                    min="1"
                                    max="31"
                                    required
                                    className="block w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm focus:ring-green-500 text-white outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}

            </div>
            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-200 transform active:scale-95 text-sm border border-transparent"
                >
                    Create Cart
                </button>
            </div>
        </form>
    );
};

const CreateCartFlowModal: React.FC<CreateCartFlowModalProps> = ({ isOpen, onClose, onSave, properties, userName }) => {
    const [step, setStep] = useState<'select_type' | 'details'>('select_type');
    const [selectedType, setSelectedType] = useState<CartType>('Standard');

    const handleTypeSelect = (type: CartType) => {
        setSelectedType(type);
        setStep('details');
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => setStep('select_type'), 300);
    };

    const handleSaveDetails = (data: Partial<Cart> & { propertyId: string; category?: string; }) => {
        const result = onSave({ type: selectedType, ...data });
        if (result.success) {
            handleClose();
        }
        return result;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="animate-gradient-bg rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-white/20 text-white" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">Create New Cart</h2>
                    <button onClick={handleClose} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 min-h-[20rem] flex flex-col">
                    {step === 'select_type' ? (
                        <CartTypeSelection onSelect={handleTypeSelect} />
                    ) : (
                        <CartDetailsForm
                            cartType={selectedType}
                            properties={properties}
                            onSubmit={handleSaveDetails}
                            onBack={() => setStep('select_type')}
                            userName={userName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateCartFlowModal;
