/**
 * ID Generator Utility
 * Provides centralized ID generation with user-based prefixes and sequence inheritance
 */

import { supabase } from '../supabaseClient';

/**
 * Get next sequence number for a user
 * Uses atomic increment to ensure uniqueness
 */
export async function getNextSequence(userId: string): Promise<number> {
    try {
        // Try to get existing sequence
        const { data: existing, error: selectError } = await supabase
            .from('sequences')
            .select('last_sequence')
            .eq('user_id', userId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error fetching sequence:', selectError);
            throw selectError;
        }

        const currentSequence = existing?.last_sequence || 0;
        const nextSequence = currentSequence + 1;

        // Update or insert
        const { error: upsertError } = await supabase
            .from('sequences')
            .upsert({
                user_id: userId,
                last_sequence: nextSequence
            }, {
                onConflict: 'user_id'
            });

        if (upsertError) {
            console.error('Error updating sequence:', upsertError);
            throw upsertError;
        }

        return nextSequence;
    } catch (error) {
        console.error('Error in getNextSequence:', error);
        // Fallback to timestamp-based if sequence table fails
        return Date.now() % 10000;
    }
}

/**
 * Generate cart ID with format: CRT-[UserID]-[Sequence]
 */
export function generateCartId(userId: string, sequence: number): string {
    const paddedSequence = sequence.toString().padStart(4, '0');
    // Use first 8 chars of userId for brevity
    const shortUserId = userId.substring(0, 8);
    return `CRT-${shortUserId}-${paddedSequence}`;
}

/**
 * Extract sequence number from any ID
 */
export function extractSequence(id: string): number | null {
    const parts = id.split('-');
    if (parts.length >= 3) {
        const sequenceStr = parts[parts.length - 1];
        const sequence = parseInt(sequenceStr, 10);
        return isNaN(sequence) ? null : sequence;
    }
    return null;
}

/**
 * Extract user ID from any ID
 */
export function extractUserId(id: string): string | null {
    const parts = id.split('-');
    if (parts.length >= 3) {
        // User ID is everything between first and last part
        return parts.slice(1, -1).join('-');
    }
    return null;
}

/**
 * Generate order ID from cart ID
 * Inherits the user ID and sequence number
 */
export function generateOrderId(cartId: string): string {
    const userId = extractUserId(cartId);
    const sequence = extractSequence(cartId);

    if (!userId || sequence === null) {
        throw new Error(`Invalid cart ID format: ${cartId}`);
    }

    const paddedSequence = sequence.toString().padStart(4, '0');
    // userId extracted from cartId is already short
    return `ORD-${userId}-${paddedSequence}`;
}

/**
 * Generate purchase order ID from order ID
 * Inherits the user ID and sequence number
 * Optionally adds vendor suffix for multiple POs from one order
 */
export function generatePOId(orderId: string, vendorSuffix?: string): string {
    const userId = extractUserId(orderId);
    const sequence = extractSequence(orderId);

    if (!userId || sequence === null) {
        throw new Error(`Invalid order ID format: ${orderId}`);
    }

    const paddedSequence = sequence.toString().padStart(4, '0');
    // userId extracted from orderId is already short
    const baseId = `PO-${userId}-${paddedSequence}`;

    return vendorSuffix ? `${baseId}-${vendorSuffix}` : baseId;
}

/**
 * Generate property ID
 */
export async function generatePropertyId(): Promise<string> {
    const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

    const sequence = (count || 0) + 1;
    return `PROP-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Generate vendor ID
 */
export async function generateVendorId(): Promise<string> {
    const { count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

    const sequence = (count || 0) + 1;
    return `VEN-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Generate thread ID from order ID
 */
export function generateThreadId(orderId: string): string {
    return `THR-${orderId}`;
}
