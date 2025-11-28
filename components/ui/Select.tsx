import React from 'react';
import { ChevronDownIcon } from '../Icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
    icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    className = '',
    containerClassName = '',
    children,
    icon,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label className="text-sm font-medium text-foreground/80 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <select
                    className={`
                        w-full appearance-none bg-card text-foreground 
                        border border-input rounded-xl px-4 py-3
                        ${icon ? 'pl-11' : ''} pr-10
                        text-sm font-medium
                        shadow-sm transition-all duration-200
                        hover:border-primary/50 hover:shadow-md hover:bg-accent/50
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                        disabled:opacity-50 disabled:cursor-not-allowed
                        cursor-pointer
                        ${error ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                    <ChevronDownIcon className="w-4 h-4" />
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
