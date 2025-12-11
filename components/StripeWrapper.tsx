import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with the user's Publishable Key
const stripePromise = loadStripe('pk_test_51SchRTCXukn2zz18gJ2uGOR0VN1alXbgLlD0DEdySi2NmMNTIh5oNky4lNqYOuuxruPCPfvn4qjXwZ8zHhjVEHjM00rLVaNrNp');

interface StripeWrapperProps {
    children: React.ReactNode;
}

export const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    );
};
