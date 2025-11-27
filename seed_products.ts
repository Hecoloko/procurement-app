
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from './supabaseClient';

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCTS_DATA = [
    {
        name: "Ravinte 30 Pack Solid 5 Inch Kitchen Cabinet Handles",
        description: "30-pack Matte Black Cabinet Pulls, Kitchen Hardware",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Hardware",
        url: "https://www.amazon.com/dp/B07SPXKNX",
        sku: "B07SPXKNX",
        imageUrl: "https://m.media-amazon.com/images/I/61D4Z3y6LlL._AC_SL1500_.jpg",
        unitPrice: 45.99
    },
    {
        name: "1x4 LED Flat Panel Light",
        description: "6-pack with Selectable CCT (3000K/4000K/5000K), Dimmable",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Lighting",
        url: "https://www.amazon.com/dp/B0FDQRWN",
        sku: "B0FDQRWN",
        imageUrl: "https://m.media-amazon.com/images/I/71P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 129.99
    },
    {
        name: "Black Kitchen Faucets with Pull Down Sprayer",
        description: "Stainless Steel Kitchen Sink Faucet",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Plumbing",
        url: "https://www.amazon.com/dp/B0915Y1LM",
        sku: "B0915Y1LM",
        imageUrl: "https://m.media-amazon.com/images/I/71+P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 79.99
    },
    {
        name: "Bathroom Faucet",
        description: "Matte Black Bathroom Sink Faucet",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Plumbing",
        url: "https://www.amazon.com/dp/B07SXK14H",
        sku: "B07SXK14H",
        imageUrl: "https://m.media-amazon.com/images/I/61P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 39.99
    },
    {
        name: "20x30 Mirror",
        description: "Black Metal Framed Bathroom Mirror",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Decor",
        url: "https://www.amazon.com/dp/B0DDPFL23",
        sku: "B0DDPFL23",
        imageUrl: "https://m.media-amazon.com/images/I/81P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 55.00
    },
    {
        name: "Vanity Light",
        description: "3-Light Bathroom Vanity Light Fixtures",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Lighting",
        url: "https://www.amazon.com/dp/B08H81ZCC",
        sku: "B08H81ZCC",
        imageUrl: "https://m.media-amazon.com/images/I/71P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 65.99
    },
    {
        name: "Shower Head",
        description: "High Pressure Rain Shower Head",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Plumbing",
        url: "https://www.amazon.com/dp/B07WBX1C",
        sku: "B07WBX1C",
        imageUrl: "https://m.media-amazon.com/images/I/61P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 29.99
    },
    {
        name: "Privacy Door Knobs",
        description: "10-pack Matte Black Door Knobs",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Hardware",
        url: "https://www.amazon.com/dp/B079R7CFY",
        sku: "B079R7CFY",
        imageUrl: "https://m.media-amazon.com/images/I/61P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 110.00
    },
    {
        name: "Cabinet Hinges",
        description: "18-pack Soft Close Cabinet Hinges",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Hardware",
        url: "https://www.amazon.com/dp/B07GF4ZR1",
        sku: "B07GF4ZR1",
        imageUrl: "https://m.media-amazon.com/images/I/61P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 35.99
    },
    {
        name: "Flush Mount Light",
        description: "6-pack 9 Inch Flush Mount LED Light",
        vendor: "Amazon",
        primaryCategory: "Renovations",
        secondaryCategory: "Lighting",
        url: "https://www.amazon.com/dp/B0CJM16VN",
        sku: "B0CJM16VN",
        imageUrl: "https://m.media-amazon.com/images/I/71P4y3y6LlL._AC_SL1500_.jpg", // Placeholder pattern
        unitPrice: 85.00
    },
    // Home Depot Items
    {
        name: "3 in. x 6 in. Ceramic Tile",
        description: "White Subway Tile, Case",
        vendor: "Home Depot",
        primaryCategory: "Renovations",
        secondaryCategory: "Flooring/Tile",
        url: "https://www.homedepot.com/p/1003",
        sku: "1003000",
        imageUrl: "https://images.thdstatic.com/productImages/placeholder.jpg",
        unitPrice: 15.98
    },
    {
        name: "33 in. Drop-in Sink",
        description: "Stainless Steel Kitchen Sink",
        vendor: "Home Depot",
        primaryCategory: "Renovations",
        secondaryCategory: "Plumbing",
        url: "https://www.homedepot.com/p/755731",
        sku: "755731",
        imageUrl: "https://images.thdstatic.com/productImages/placeholder.jpg",
        unitPrice: 149.00
    },
    {
        name: "30x80 Door Slab",
        description: "Interior Door Slab, Primed",
        vendor: "Home Depot",
        primaryCategory: "Renovations",
        secondaryCategory: "Doors",
        url: "https://www.homedepot.com/p/837288",
        sku: "837288",
        imageUrl: "https://images.thdstatic.com/productImages/placeholder.jpg",
        unitPrice: 65.00
    },
    {
        name: "Moldings/Trim",
        description: "Baseboard Molding 96 inch",
        vendor: "Home Depot",
        primaryCategory: "Renovations",
        secondaryCategory: "Lumber",
        url: "https://www.homedepot.com/p/L412A-9309",
        sku: "L412A-9309",
        imageUrl: "https://images.thdstatic.com/productImages/placeholder.jpg",
        unitPrice: 12.50
    }
];

const seedProducts = async () => {
    console.log("Seeding products...");

    // Sign in as an admin to bypass RLS (hopefully)
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Failed to sign in:", authError.message);
        console.log("Attempting to proceed anonymously...");
    } else {
        console.log("Signed in as admin.");
    }

    // Get Companies
    let { data: companies } = await supabase.from('companies').select('id, name');

    if (!companies || companies.length < 2) {
        console.log("Creating default companies...");
        const { data: newCompanies, error: companyError } = await supabase.from('companies').insert([
            { id: 'comp-1', name: 'Company 1' },
            { id: 'comp-2', name: 'Company 2' }
        ]).select();

        if (companyError) {
            console.error("Error creating companies:", companyError);
            // Try to fetch again in case they existed but query failed or partial insert
            const { data: retryCompanies } = await supabase.from('companies').select('id, name');
            companies = retryCompanies;
        } else {
            companies = newCompanies;
        }
    }

    if (!companies || companies.length < 2) {
        console.error("Failed to ensure 2 companies exist. Aborting.");
        return;
    }

    const company1 = companies[0].id;
    const company2 = companies[1].id;

    console.log(`Seeding for Company 1: ${companies[0].name} (${company1})`);
    console.log(`Seeding for Company 2: ${companies[1].name} (${company2})`);

    const productsToInsert = PRODUCTS_DATA.map((prod, index) => {
        // Split roughly half and half
        const targetCompany = index % 2 === 0 ? company1 : company2;

        return {
            id: `prod-seed-${Date.now()}-${index}`,
            company_id: targetCompany,
            name: prod.name,
            description: prod.description,
            vendor_id: null,
            sku: prod.sku,
            unit_price: prod.unitPrice,
            image_url: prod.imageUrl,
            primary_category: prod.primaryCategory,
            secondary_category: prod.secondaryCategory,
            rating: 4.5,
            tags: [prod.vendor]
        };
    });

    const { error } = await supabase.from('products').insert(productsToInsert);

    if (error) {
        console.error("Error inserting products:", error);
    } else {
        console.log(`Successfully inserted ${productsToInsert.length} products.`);
    }
};

seedProducts();
