import { supabase } from '../supabaseClient';
import { Invoice, InvoiceItem } from '../types';

export const invoiceService = {
    async getInvoices(companyId: string) {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customer:customers(name)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((inv: any) => ({
            id: inv.id,
            companyId: inv.company_id,
            customerId: inv.customer_id,
            invoiceNumber: inv.invoice_number,
            status: inv.status,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            subtotal: inv.subtotal,
            taxTotal: inv.tax_total,
            totalAmount: inv.total_amount,
            amountPaid: inv.amount_paid,
            balanceDue: inv.balance_due,
            notes: inv.notes,
            createdBy: inv.created_by,
            customer: { name: inv.customer?.name } // flattened for list view
        })) as Invoice[];
    },

    async getInvoiceById(id: string) {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, items:invoice_items(*), customer:customers(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        const invoice: Invoice = {
            id: data.id,
            companyId: data.company_id,
            customerId: data.customer_id,
            invoiceNumber: data.invoice_number,
            status: data.status,
            issueDate: data.issue_date,
            dueDate: data.due_date,
            subtotal: data.subtotal,
            taxTotal: data.tax_total,
            totalAmount: data.total_amount,
            amountPaid: data.amount_paid,
            balanceDue: data.balance_due,
            notes: data.notes,
            createdBy: data.created_by,
            customer: {
                ...data.customer,
                billingAddress: data.customer.billing_address,
                shippingAddress: data.customer.shipping_address
            },
            items: data.items.map((item: any) => ({
                id: item.id,
                invoiceId: item.invoice_id,
                productId: item.product_id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                taxRate: item.tax_rate,
                totalPrice: item.total_price
            }))
        };

        return invoice;
    },

    async createInvoice(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) {
        // 1. Create Invoice Header
        const { data: invData, error: invError } = await supabase
            .from('invoices')
            .insert([{
                company_id: invoice.companyId,
                customer_id: invoice.customerId,
                invoice_number: invoice.invoiceNumber,
                status: invoice.status || 'Draft',
                issue_date: invoice.issueDate,
                due_date: invoice.dueDate,
                subtotal: invoice.subtotal,
                tax_total: invoice.taxTotal,
                total_amount: invoice.totalAmount,
                notes: invoice.notes,
                created_by: invoice.createdBy
            }])
            .select()
            .single();

        if (invError) throw invError;

        const invoiceId = invData.id;

        // 2. Create Items
        const itemsPayload = items.map(item => ({
            invoice_id: invoiceId,
            product_id: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate || 0
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsPayload);
        if (itemsError) {
            // Rollback header if items fail (not real DB transaction here but best effort clean up)
            await supabase.from('invoices').delete().eq('id', invoiceId);
            throw itemsError;
        }

        return invoiceId;
    },

    async createPaymentIntent(amount: number) {
        const { data, error } = await supabase.functions.invoke('manage-invoice', {
            body: { action: 'create-payment-intent', amount }
        });

        if (error) throw error;
        return data;
    }
};
