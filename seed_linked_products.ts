
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const GLOBAL_PRODUCTS = [
    {
        id: 'gp-001',
        name: 'Dell XPS 15 Laptop',
        sku: 'DELL-XPS-15',
        description: '15-inch laptop with 4K display, Intel Core i9, 32GB RAM.',
        unit_price: 1899.99,
        image_url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9520/media-gallery/black/notebook-xps-9520-black-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=575&qlt=100,1&resMode=sharp2&size=575,402&chrss=full',
        category: 'Electronics',
        provider: 'Amazon Business',
        specs: { processor: 'Intel Core i9', ram: '32GB', storage: '1TB SSD' }
    },
    {
        id: 'gp-002',
        name: 'Herman Miller Aeron Chair',
        sku: 'HM-AERON-B',
        description: 'Ergonomic office chair, size B, graphite color.',
        unit_price: 1450.00,
        image_url: 'https://images.hermanmiller.group/m/336d4b90556e4f31/W-Aeron-Chair_202211221146.png?blend-mode=darken&blend=f8f8f8&trim=0&trim-sd=1&auto=format&w=1200&h=900&q=80',
        category: 'Furniture',
        provider: 'Office Depot',
        specs: { material: 'Mesh', color: 'Graphite', size: 'B' }
    },
    {
        id: 'gp-003',
        name: 'Logitech MX Master 3S',
        sku: 'LOGI-MX3S',
        description: 'Performance wireless mouse, ultra-fast scrolling.',
        unit_price: 99.99,
        image_url: 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png?v=1',
        category: 'Electronics',
        provider: 'Amazon Business',
        specs: { connectivity: 'Bluetooth/USB', dpi: '8000' }
    },
    {
        id: 'gp-004',
        name: 'Apple MacBook Pro 16"',
        sku: 'APP-MBP-16',
        description: 'M2 Max chip, 32GB Unified Memory, 1TB SSD.',
        unit_price: 3499.00,
        image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202301?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1671304673202',
        category: 'Electronics',
        provider: 'Amazon Business',
        specs: { chip: 'M2 Max', screen: '16-inch Liquid Retina XDR' }
    },
    {
        id: 'gp-005',
        name: 'Sharpie Permanent Markers',
        sku: 'SHARPIE-BLK-12',
        description: 'Fine point, black, 12-pack.',
        unit_price: 12.99,
        image_url: 'https://m.media-amazon.com/images/I/71+GjGgKk+L._AC_SL1500_.jpg',
        category: 'Office Supplies',
        provider: 'Office Depot',
        specs: { color: 'Black', quantity: '12' }
    }
];

async function seed() {
    console.log("Starting seed...");

    // 2. Process Companies
    const companyAdmins = [
        { email: 'alexa.reserva.demo_v3@gmail.com', password: 'Xoxoxo123', companyId: 'comp-1' },
        { email: 'amelia.cruz.demo_v3@gmail.com', password: 'Xoxoxo123', companyId: 'comp-2' }
    ];

    for (const admin of companyAdmins) {
        console.log(`Processing Company: ${admin.companyId} (User: ${admin.email})`);

        // Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: admin.email,
            password: admin.password
        });

        if (authError || !authData.session) {
            console.error(`  Login failed for ${admin.email}:`, authError);
            continue;
        }

        console.log("  Logged in successfully.");

        // Ensure Vendors Exist
        const vendorsToEnsure = ['Amazon Business', 'Office Depot'];
        const vendorMap = new Map<string, string>(); // Name -> ID

        for (const vendorName of vendorsToEnsure) {
            // Check if exists
            const { data: existing } = await supabase.from('vendors')
                .select('id')
                .eq('company_id', admin.companyId)
                .eq('name', vendorName)
                .single();

            let vendorId = existing?.id;

            if (!vendorId) {
                console.log(`  Creating vendor ${vendorName} for ${admin.companyId}...`);
                vendorId = `vendor-${admin.companyId}-${vendorName.replace(/\s+/g, '-').toLowerCase()}`;
                const { error: vError } = await supabase.from('vendors').insert({
                    id: vendorId,
                    company_id: admin.companyId,
                    name: vendorName,
                    email: `orders@${vendorName.replace(/\s+/g, '').toLowerCase()}.com`,
                    phone: '555-0123'
                });
                if (vError) console.error(`  Error creating vendor ${vendorName}:`, vError);
            }
            if (vendorId) vendorMap.set(vendorName, vendorId);
        }

        // Adopt Products
        for (const gp of GLOBAL_PRODUCTS) {
            // Check if already adopted
            const { data: existingProd } = await supabase.from('products')
                .select('id')
                .eq('company_id', admin.companyId)
                .eq('global_product_id', gp.id)
                .single();

            if (!existingProd) {
                console.log(`  Adopting ${gp.name}...`);
                const vendorId = vendorMap.get(gp.provider) || vendorMap.get('Amazon Business'); // Fallback

                const { error: pError } = await supabase.from('products').insert({
                    id: `prod-${admin.companyId}-${gp.sku}`,
                    company_id: admin.companyId,
                    global_product_id: gp.id,
                    vendor_id: vendorId,
                    name: gp.name, // Can be customized
                    sku: `${gp.sku}-${admin.companyId.split('-')[1].toUpperCase()}`, // Custom SKU
                    description: gp.description,
                    unit_price: gp.unit_price,
                    image_url: gp.image_url,
                    primary_category: gp.category,
                    secondary_category: 'General',
                    rating: 5,
                    tags: [gp.provider, 'Global']
                });

                if (pError) console.error(`  Error adopting ${gp.name}:`, pError);
            } else {
                console.log(`  ${gp.name} already adopted.`);
            }
        }

        // Logout
        await supabase.auth.signOut();
    }

    console.log("Seed complete!");
}

seed();
