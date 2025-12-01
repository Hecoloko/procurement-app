import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const globalProducts = [
    {
        id: 'gp-001',
        name: 'Dell XPS 15 Laptop',
        sku: 'DELL-XPS-15',
        description: 'High-performance laptop with 4K display.',
        unit_price: 1899.99,
        image_url: 'https://picsum.photos/seed/dellxps/400/300',
        category: 'Electronics',
        provider: 'Amazon Business',
        specs: { processor: 'i9', ram: '32GB', storage: '1TB SSD' }
    },
    {
        id: 'gp-002',
        name: 'Herman Miller Aeron Chair',
        sku: 'HM-AERON-B',
        description: 'Ergonomic office chair, size B.',
        unit_price: 1250.00,
        image_url: 'https://picsum.photos/seed/aeron/400/300',
        category: 'Furniture',
        provider: 'Herman Miller',
        specs: { color: 'Graphite', size: 'B' }
    },
    {
        id: 'gp-003',
        name: 'Logitech MX Master 3S',
        sku: 'LOGI-MX3S',
        description: 'Advanced wireless mouse for productivity.',
        unit_price: 99.99,
        image_url: 'https://picsum.photos/seed/mxmaster/400/300',
        category: 'Electronics',
        provider: 'Amazon Business',
        specs: { connectivity: 'Bluetooth/USB', dpi: '8000' }
    },
    {
        id: 'gp-004',
        name: 'Apple MacBook Pro 16"',
        sku: 'APL-MBP-16',
        description: 'M3 Max chip, 36GB Unified Memory.',
        unit_price: 3499.00,
        image_url: 'https://picsum.photos/seed/macbook/400/300',
        category: 'Electronics',
        provider: 'Apple',
        specs: { chip: 'M3 Max', screen: '16-inch' }
    },
    {
        id: 'gp-005',
        name: 'Standing Desk Converter',
        sku: 'VARIDESK-PRO',
        description: 'Adjustable height desk converter.',
        unit_price: 395.00,
        image_url: 'https://picsum.photos/seed/varidesk/400/300',
        category: 'Furniture',
        provider: 'Vari',
        specs: { width: '36 inches' }
    }
];

async function seedGlobalProducts() {
    console.log('🌱 Seeding global products...');

    const { error } = await supabase
        .from('global_products')
        .upsert(globalProducts, { onConflict: 'id' });

    if (error) {
        console.error('❌ Error seeding global products:', error);
    } else {
        console.log('✅ Global products seeded successfully!');
    }
}

seedGlobalProducts();
