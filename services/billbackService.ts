import { supabase } from '../supabaseClient';
import { Order, CartItem, Product } from '../types';

export const billbackService = {
    // Fetch orders that are completed/received but not yet billed
    async getUnbilledOrders(companyId: string, propertyId?: string): Promise<Order[]> {
        let query = supabase
            .from('orders')
            .select('*, cart:carts(cart_items(*)), purchase_orders(*)')
            .eq('company_id', companyId)
            // We usually only bill for Completed or Received orders
            // Adjust logic based on exact business rule; usually "Completed" means everything is done.
            // Or "Received" means goods are here.
            .in('status', ['Completed', 'Received', 'Shipped'])
            .neq('billing_status', 'Billed');

        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Use the existing mapOrder function logic or a simplified version
        // Ideally we should import mapOrder from App.tsx or move it to a shared helper
        // For now, I'll do a basic mapping sufficient for the Invoice UI
        return data.map((dbOrder: any) => ({
            id: dbOrder.id,
            companyId: dbOrder.company_id,
            cartId: dbOrder.cart_id,
            cartName: dbOrder.cart_name || 'Untitled Order',
            workOrderId: dbOrder.cart?.work_order_id, // Important for display
            submittedBy: dbOrder.submitted_by,
            submissionDate: dbOrder.created_at,
            totalCost: dbOrder.total_cost,
            status: dbOrder.status,
            billingStatus: dbOrder.billing_status || 'Unbilled',
            propertyId: dbOrder.property_id,
            items: dbOrder.cart?.cart_items?.map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice: item.total_price || (item.quantity * item.unit_price) // Ensure total price is calculated
            })) || []
        })) as Order[];
    },

    // When an invoice is created, link it to the orders and mark them as billed
    async markOrdersAsBilled(orderIds: string[], invoiceId: string) {
        if (orderIds.length === 0) return;

        const { error } = await supabase
            .from('orders')
            .update({
                billing_status: 'Billed',
                invoice_id: invoiceId
            })
            .in('id', orderIds);

        if (error) throw error;
    },

    async getUnbilledBillableItems(companyId: string, propertyId?: string): Promise<any[]> {
        let query = supabase
            .from('billable_items')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'Pending');

        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            companyId: item.company_id,
            sourceType: item.source_type,
            sourceId: item.source_id,
            propertyId: item.property_id,
            unitId: item.unit_id,
            customerId: item.customer_id,
            description: item.description,
            costAmount: item.cost_amount,
            markupAmount: item.markup_amount,
            totalAmount: item.total_amount,
            status: item.status
        }));
    },

    async markBillableItemsAsInvoiced(itemIds: string[], invoiceId: string) {
        if (itemIds.length === 0) return;
        const { error } = await supabase
            .from('billable_items')
            .update({
                status: 'Invoiced',
                invoice_id: invoiceId
            })
            .in('id', itemIds);
        if (error) throw error;
    },

    // NEW: Auto-create billable items from a paid Vendor Invoice
    async createBillableItemsFromVendorInvoice(vendorInvoiceId: string) {
        // ... (existing implementation)
        // 1. Get invoice items
        const { data: invoiceItems, error: fetchError } = await supabase
            .from('vendor_invoice_items')
            .select('*, vendor_invoices!inner(company_id)')
            .eq('invoice_id', vendorInvoiceId);

        if (fetchError) throw fetchError;
        if (!invoiceItems || invoiceItems.length === 0) return;

        // 2. Map to billable items
        const { data: invoice, error: invError } = await supabase
            .from('vendor_invoices')
            .select('purchase_order_id, purchase_orders(original_order_id, orders(property_id))')
            .eq('id', vendorInvoiceId)
            .single();

        if (invError) throw invError;

        const propertyId = (invoice as any)?.purchase_orders?.orders?.property_id;

        const billablePayload = invoiceItems.map((item: any) => ({
            company_id: item.vendor_invoices.company_id,
            property_id: propertyId || null,
            source_type: 'VendorInvoice',
            source_id: vendorInvoiceId,
            description: item.description,
            cost_amount: item.total_price,
            markup_amount: 0, // Removed auto 20% markup
            total_amount: item.total_price, // Total = Cost
            status: 'Pending'
        }));

        const { error: insertError } = await supabase
            .from('billable_items')
            .insert(billablePayload);

        if (insertError) throw insertError;
    },

    // NEW: Auto-create billable items from a paid Purchase Order
    async createBillableItemsFromPurchaseOrder(poId: string) {
        console.log("createBillableItemsFromPurchaseOrder called for PO:", poId);

        // 1. Fetch PO and deeper relations to get Items from the linked Cart
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                orders!original_order_id (
                    company_id,
                    property_id,
                    unit_id,
                    cart:carts (
                        cart_items (
                            *
                        )
                    )
                )
            `)
            .eq('id', poId)
            .single();

        if (poError || !po) {
            console.error("Error fetching PO for billback:", poError);
            throw new Error(`Could not fetch PO details: ${poError?.message}`);
        }

        // Navigate the nested structure to find items
        // Structure: po -> orders -> cart -> cart_items
        const order = po.orders as any;
        const cart = order?.cart as any;
        const cartItems = cart?.cart_items;

        console.log("Cart Items Raw:", cartItems);

        const items = Array.isArray(cartItems) ? cartItems : [];

        console.log("Found Items for Billback:", items.length);

        if (!items || items.length === 0) {
            console.warn("No items found linked to this PO via Order/Cart.");
            return;
        }

        const orderPropertyId = order?.property_id;
        const companyId = order?.company_id || (po as any).company_id;

        const billablePayload = items
            .filter((item: any) => item.purchase_order_id === poId)
            .map((item: any) => {
                const cost = item.total_price || (item.unit_price * item.quantity);
                // Use item-specific property ID if available (not on cart_item usually), otherwise Order's property ID
                const targetPropertyId = orderPropertyId || null;

                return {
                    company_id: companyId,
                    property_id: targetPropertyId,
                    unit_id: order?.unit_id || null,
                    source_type: 'PurchaseOrder',
                    source_id: poId,
                    description: `${item.name} (Qty: ${item.quantity})`,
                    cost_amount: cost,
                    markup_amount: 0, // Removed auto 20% markup
                    total_amount: cost, // Total = Cost
                    status: 'Pending'
                };
            });

        console.log("Generating Billable Items Payload:", JSON.stringify(billablePayload));

        const { error: insertError } = await supabase
            .from('billable_items')
            .insert(billablePayload);

        if (insertError) {
            console.error("Error inserting billable items:", insertError);
            throw insertError;
        }
    },

    // NEW: Sync all missing paid POs
    async syncMissingBillableItems(companyId: string) {
        console.log("Starting Sync for Company:", companyId);

        // 1. Get all Paid POs (payment_date is not null)
        const { data: paidPOs, error: poError } = await supabase
            .from('purchase_orders')
            .select('id, payment_date')
            .not('payment_date', 'is', null);

        if (poError) throw poError;
        if (!paidPOs || paidPOs.length === 0) return 0;

        const paidPoIds = paidPOs.map(po => po.id);

        // 2. Get all Billable Items with source_type = 'PurchaseOrder'
        // We MUST batch this query because sending too many IDs in .in() causes a 400 URL Too Long error
        const existingSourceIds = new Set<string>();
        const BATCH_SIZE = 5;

        for (let i = 0; i < paidPoIds.length; i += BATCH_SIZE) {
            const chunk = paidPoIds.slice(i, i + BATCH_SIZE);

            const { data: chunkItems, error: chunkError } = await supabase
                .from('billable_items')
                .select('source_id')
                .eq('source_type', 'PurchaseOrder')
                .in('source_id', chunk);

            if (chunkError) {
                console.error("Error checking batch existing items:", chunkError);
                // Continue to next batch rather than failing everything
            }

            if (chunkItems) {
                chunkItems.forEach((item: any) => existingSourceIds.add(item.source_id));
            }
        }

        // 3. Find Missing
        const missingPoIds = paidPoIds.filter(id => !existingSourceIds.has(id));
        console.log(`Found ${missingPoIds.length} missing POs to sync.`);

        // 4. Create items for each missing PO
        let successCount = 0;
        for (const poId of missingPoIds) {
            try {
                await this.createBillableItemsFromPurchaseOrder(poId);
                successCount++;
            } catch (err) {
                console.error(`Failed to sync PO ${poId}:`, err);
            }
        }
        return successCount;
    },

    // MAINTENANCE: Reset Markups for all Pending Items
    async resetPendingMarkups(companyId: string) {
        console.log("Resetting markups for company:", companyId);

        // Fetch all pending items first to minimize logic mismatch? 
        // Or efficient SQL update? Supabase doesn't support 'update item set total = cost' directly via simple JS client 
        // without a stored proc or raw sql unless we do it row-by-row or if the logic is constant.
        // But we can't reference another column in the update value easily in JS client (e.g. total_amount = cost_amount).
        // So we must fetch, Iterate, and Update. 

        const { data: items, error } = await supabase
            .from('billable_items')
            .select('id, cost_amount')
            .eq('company_id', companyId)
            .eq('status', 'Pending');

        if (error) throw error;
        if (!items || items.length === 0) return 0;

        let count = 0;
        // Batch updates? Or parallel?
        for (const item of items) {
            const { error: updateError } = await supabase
                .from('billable_items')
                .update({
                    markup_amount: 0,
                    total_amount: item.cost_amount
                })
                .eq('id', item.id);

            if (!updateError) count++;
        }
        return count;
    }
};
