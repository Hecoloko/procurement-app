import { supabase } from '../supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe Promise
// Note: In a real app, this key should come from an environment variable (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

class StripeService {
    /**
     * Creates a Stripe Checkout Session for an Invoice Payment
     */
    async createCheckoutSession(invoiceId: string, companyId: string) {
        try {
            console.log("Initiating invoice checkout...", { invoiceId, companyId });

            // Invoke the Edge Function to create the session
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: {
                    invoiceId,
                    companyId
                }
            });

            if (error) throw error;

            // In Hosted Checkout mode, the backend returns a URL to redirect to
            if (data?.url) {
                window.location.href = data.url;
                return { success: true };
            } else if (data?.sessionId) {
                // If backend returns session ID only, we redirect using client SDK
                const stripe = await stripePromise;
                if (!stripe) throw new Error('Stripe failed to load');

                const { error: redirectError } = await (stripe as any).redirectToCheckout({
                    sessionId: data.sessionId
                });

                if (redirectError) throw redirectError;
                return { success: true };
            }

            throw new Error('No checkout URL or Session ID returned');

        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred'
            };
        }
    }

    /**
     * Placeholder for Portal Session (if needed later)
     */
    async createPortalSession() {
        // Implementation for customer portal
        return { success: false, error: 'Not implemented for this project yet' };
    }
}

export const stripeService = new StripeService();
