
import React, { useEffect, useState } from 'react';

interface SolaIFieldsProps {
    onLoad?: () => void;
    onError?: (err: string) => void;
}

declare global {
    interface Window {
        ckIfields: any;
        ckIsLoaded: boolean;
    }
}

const IFIELDS_KEY = 'ifields_simchadev3997ca8859db4995a41e06eb0abc'; // From verification script
const IFIELDS_VERSION = '2.15.2307.2601';

export const SolaIFields: React.FC<SolaIFieldsProps> = ({ onLoad, onError }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (window.ckIsLoaded) {
            setIsLoaded(true);
            onLoad?.();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://cdn.cardknox.com/ifields/${IFIELDS_VERSION}/ifields.min.js`;
        script.async = true;

        script.onload = () => {
            console.log("Sola iFields Script Loaded");
            window.ckIsLoaded = true;
            setIsLoaded(true);

            // Initialize iFields
            if (window.ckIfields) {
                // Configure iFields
                // Note: we can set styles here to match our app
                const defaultStyle = {
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#374151', // text-gray-700
                    boxSizing: 'border-box'
                };

                // We don't strictly need to set these if we use the default IDs expected by the script
                // The default IDs are usually 'ifields-card-number' and 'ifields-cvv' (or similar, checking docs or assumption)
                // Actually, typically you call setAccount or configs.

                //  window.ckIfields.setAccount(IFIELDS_KEY, "NexusPay", "1.0"); 
                // ^ Check correct init method. Often it auto-inits on fields with specific IDs data-ifields-key.
            }
            onLoad?.();
        };

        script.onerror = () => {
            const msg = "Failed to load Payment Security Module.";
            console.error(msg);
            onError?.(msg);
        };

        document.body.appendChild(script);

        return () => {
            // Cleanup if needed, but usually we leave the script
        };
    }, []);

    // Helper to get token
    // This function is meant to be called by the parent via ref or similar, 
    // but for simplicity in this component we might just expose the setup.
    // Actually, typical pattern: Parent has a ref to this component or we expose a helper function.

    return (
        <div className="space-y-4">
            {/* Card Number Container */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <div
                    id="ifields-card-number"
                    data-ifields-id="card-number"
                    className="h-10 w-full border border-gray-300 rounded-md px-3 py-2 bg-white flex items-center shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500"
                    style={{ iframe: { height: '100%', width: '100%' } } as any}
                >
                    {/* iFrame injected here by script */}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* CVV Container */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <div
                        id="ifields-cvv"
                        data-ifields-id="cvv"
                        className="h-10 w-full border border-gray-300 rounded-md px-3 py-2 bg-white flex items-center shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500"
                    >
                        {/* iFrame injected here */}
                    </div>
                </div>
            </div>

            {/* Hidden Input for Token - Optional, but good for form submission if using form */}
            <input type="hidden" id="ifields-token" data-ifields-id="card-token" />
        </div>
    );
};

// Global Helper to get Token
export const getSolaToken = (onSuccess: (token: any) => void, onError: (err: any) => void) => {
    if (!window.ckIfields) {
        onError("Payment System not ready.");
        return;
    }

    // Standard call for iFields
    window.ckIfields.getToken(IFIELDS_KEY, "NexusPay", "1.0", (response: any) => {
        if (response.xResult === 'E') {
            onError(response.xError);
        } else {
            onSuccess(response); // Contains xToken
        }
    });
};
