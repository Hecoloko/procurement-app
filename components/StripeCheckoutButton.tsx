import React, { useState } from 'react';
import { stripeService } from '../services/stripeService';

interface StripeCheckoutButtonProps {
    invoiceId: string;
    companyId: string;
    className?: string;
    label?: string;
}

export const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
    invoiceId,
    companyId,
    className = "",
    label = "Pay Invoice Online"
}) => {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        const result = await stripeService.createCheckoutSession(invoiceId, companyId);

        if (!result.success) {
            alert(result.error || 'Payment initiation failed');
            setLoading(false);
        }
        // If success, the page redirects, so no need to stop loading usually
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            className={`w-full max-w-sm mx-auto flex items-center justify-center px-8 py-4 bg-[#635BFF] hover:bg-[#5851df] text-white text-lg font-bold rounded-lg transition-all shadow-md hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
            style={{
                backgroundColor: '#5851df', // Specific purple from screenshot analysis or close approximation
                boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
        >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Processing...
                </>
            ) : (
                label
            )}
        </button>
    );
};
