
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DatabaseProfile {
    id: string;
    company_id: string;
    full_name: string;
    role_id: string;
}

// Helper to get the current user's profile securely
export const getCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*') // Select all to avoid column mismatch errors
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    // Ensure Owner Role for specific email
    if (profile && user.email === 'heco2k19@gmail.com' && profile.role_id !== 'role-0') {
        await supabase.from('profiles').update({ role_id: 'role-0', company_id: 'comp-1' }).eq('id', user.id);
        profile.role_id = 'role-0';
        profile.company_id = 'comp-1';
    }

    return profile;
};

// Self-healing: Create a profile if one doesn't exist (e.g. for users created before triggers)
export const createDefaultProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. CHECK: Does a profile with this email already exist (from seed)?
    const { data: existingSeedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

    if (existingSeedProfile) {
        // If found, "claim" this profile by updating the ID to match the real Auth ID
        // Note: This assumes the seed IDs (like 'user-c1-1') are not UUIDs and thus won't conflict
        // with Supabase Auth UUIDs, or that we want to overwrite.
        // To be safe, we DELETE the old row and INSERT the new one with the same data but new ID,
        // OR we update the ID if the DB allows (PK updates can be tricky).
        // Simpler strategy: Update the existing row's ID.
        // However, if ID is PK, we might need to handle cascades. 
        // For this demo, let's try to UPDATE the ID. If that fails due to FKs, we should have set ON UPDATE CASCADE in schema (not default).
        // Alternative: Create new profile with correct ID, copy data.

        // Attempt to update the ID directly (Postgres allows this if no FK constraints block it)
        // BUT, we have FKs. So we will do an UPSERT using the Auth ID, and copy data from seed profile.

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id, // The real UUID
                company_id: existingSeedProfile.company_id,
                full_name: existingSeedProfile.full_name,
                email: existingSeedProfile.email,
                role_id: existingSeedProfile.role_id,
                avatar_url: existingSeedProfile.avatar_url,
                status: existingSeedProfile.status,
                property_ids: existingSeedProfile.property_ids
            })
            .select()
            .single();

        if (!updateError) {
            // Clean up the old seed entry to prevent duplicates if querying by email later
            // Only delete if the ID was different (it should be, 'user-c1-1' vs UUID)
            if (existingSeedProfile.id !== user.id) {
                await supabase.from('profiles').delete().eq('id', existingSeedProfile.id);
            }
            return existingSeedProfile; // Return the data we just used
        }
    }

    // 2. If no seed profile, create default new one
    const defaultCompanyId = 'comp-1';

    // Check for Owner Email (legacy check)
    const isOwner = user.email === 'heco2k19@gmail.com';
    const roleId = isOwner ? 'role-0' : 'role-1';

    const { data, error } = await supabase.from('profiles').insert({
        id: user.id,
        company_id: defaultCompanyId,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'New User',
        role_id: roleId,
        status: 'Active'
    }).select().single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return existing;
        }
        console.error("Error creating default profile:", error);
        throw error;
    }
    return data;
}
