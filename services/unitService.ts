import { supabase } from '../supabaseClient';
import { Unit } from '../types';

export const unitService = {
    async getUnitsByProperty(propertyId: string) {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('property_id', propertyId)
            .order('name');

        if (error) throw error;
        return data as Unit[]; // Assuming database columns match type or are mapped if needed
    }
};
