import { SupabaseClient } from '@supabase/supabase-js';

export const backfillVendorPrices = async (supabase: SupabaseClient, companyId: string) => {
    console.log("Starting Vendor Price Backfill for Company:", companyId);

    try {
        // 1. Fetch all products for the company
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId);

        if (prodError || !products) {
            console.error("Backfill Error: Could not fetch products", prodError);
            return;
        }

        // 2. Fetch all vendors for the company
        const { data: vendors, error: vendError } = await supabase
            .from('vendors')
            .select('*')
            .eq('company_id', companyId);

        if (vendError || !vendors) {
            console.error("Backfill Error: Could not fetch vendors", vendError);
            return;
        }

        // 3. Fetch all existing price entries (product_vendors)
        // We fetch ALL because filtering by massive lists of IDs is hard. 
        // We rely on the client-side set for existence check.
        // Assuming the dataset < 10000 for now.
        const { data: existingPrices, error: priceError } = await supabase
            .from('product_vendors')
            .select('product_id, vendor_id');

        if (priceError) {
            console.error("Backfill Error: Could not fetch existing prices", priceError);
            return;
        }

        const existingMap = new Set((existingPrices || []).map(pv => `${pv.product_id}:${pv.vendor_id}`));
        const toInsert: any[] = [];

        console.log(`Backfill Analysis: ${products.length} Products, ${vendors.length} Vendors. Existing Prices: ${existingPrices?.length}`);

        products.forEach(p => {
            vendors.forEach(v => {
                const key = `${p.id}:${v.id}`;
                if (!existingMap.has(key)) {
                    // Generate a price close to the unit_price
                    // Variance between -15% and +15%
                    // If vendor is the "primary" (matches product.vendor_id), keep it exact or slightly cheaper

                    const isPrimary = p.vendor_id === v.id;
                    let price = p.unit_price;

                    if (!isPrimary) {
                        const variance = 0.85 + Math.random() * 0.30; // 85% to 115%
                        price = price * variance;
                    }

                    // Ensure not zero or negative
                    if (price <= 0.01) price = p.unit_price || 10.00;

                    toInsert.push({
                        product_id: p.id,
                        vendor_id: v.id,
                        vendor_sku: p.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
                        price: parseFloat(price.toFixed(2)),
                        is_preferred: isPrimary
                    });
                }
            });
        });

        if (toInsert.length > 0) {
            console.log(`Backfill: Found ${toInsert.length} missing price entries. Inserting...`);

            // Batch insert in chunks of 100 to avoid request size limits
            const batchSize = 100;
            for (let i = 0; i < toInsert.length; i += batchSize) {
                const batch = toInsert.slice(i, i + batchSize);
                const { error: insertError } = await supabase
                    .from('product_vendors')
                    .insert(batch);

                if (insertError) {
                    console.error(`Backfill Error: Batch ${i} failed`, insertError);
                } else {
                    console.log(`Backfill: Batch ${i} inserted successfully.`);
                }
            }
            console.log("Backfill Complete.");
            return true; // Signal that we updated data
        } else {
            console.log("Backfill: No missing prices found.");
            return false;
        }

    } catch (err) {
        console.error("Backfill Unexpected Error:", err);
        return false;
    }
};
