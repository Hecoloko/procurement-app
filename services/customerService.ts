import { supabase } from '../supabaseClient';
import { Customer } from '../types';

export const customerService = {
    async getCustomers(companyId: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;
        // Map snake_case to camelCase
        return data.map((c: any) => ({
            ...c,
            billingAddress: c.billing_address,
            shippingAddress: c.shipping_address,
            companyId: c.company_id,
            taxId: c.tax_id,
            paymentTerms: c.payment_terms
        })) as Customer[];
    },

    async createCustomer(customer: Omit<Customer, 'id' | 'companyId'> & { companyId: string }) {
        const { data, error } = await supabase
            .from('customers')
            .insert([{
                company_id: customer.companyId,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                billing_address: customer.billingAddress,
                shipping_address: customer.shippingAddress,
                tax_id: customer.taxId,
                payment_terms: customer.paymentTerms,
                notes: customer.notes
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateCustomer(id: string, updates: Partial<Customer>) {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.email) payload.email = updates.email;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.billingAddress) payload.billing_address = updates.billingAddress;
        if (updates.shippingAddress) payload.shipping_address = updates.shippingAddress;
        if (updates.taxId) payload.tax_id = updates.taxId;
        if (updates.paymentTerms) payload.payment_terms = updates.paymentTerms;
        if (updates.notes) payload.notes = updates.notes;

        const { data, error } = await supabase
            .from('customers')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
