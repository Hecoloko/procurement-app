import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../Icons';

export interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    label?: string;
    icon?: React.ReactNode;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    label,
    icon,
    className = '',
    placeholder = 'Select...',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
            {label && (
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
                        w-full flex items-center justify-between
                        bg-background text-foreground
                        border border-input rounded-xl px-4 py-2.5
                        text-sm font-medium
                        shadow-sm transition-all duration-200
                        hover:border-primary/50 hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${icon ? 'pl-10' : ''}
                        ${className}
                        ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
                    `}
                    disabled={disabled}
                >
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDownIcon
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="max-h-60 overflow-y-auto py-1">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                                        flex items-center justify-between
                                        ${option.value === value
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                                        }
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.value === value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
