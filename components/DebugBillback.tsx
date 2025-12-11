
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { billbackService } from '../services/billbackService';

const DebugBillback = () => {
    const [log, setLog] = useState('');

    const [foundPO, setFoundPO] = useState<any>(null);
    const [existingBillableCount, setExistingBillableCount] = useState<number | null>(null);

    const runDebug = async () => {
        setLog('Starting debug...\n');
        setFoundPO(null);
        setExistingBillableCount(null);

        try {
            // 1. Fetch last "Paid" PO
            const { data: pos, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .not('payment_date', 'is', null) // Paid POs
                .order('payment_date', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!pos || pos.length === 0) {
                setLog(prev => prev + 'No Paid POs found.\n');
                return;
            }

            const po = pos[0];
            setFoundPO(po);
            setLog(prev => prev + `Found PO: ${po.id}, Status: ${po.status}\n`);

            // 2. Check if Billable Items already exist
            const { count, error: countError } = await supabase
                .from('billable_items')
                .select('*', { count: 'exact', head: true })
                .eq('source_id', po.id);

            if (countError) throw countError;
            setExistingBillableCount(count || 0);
            setLog(prev => prev + `Existing Billable Items for this PO: ${count}\n`);

            // 3. Fetch Deep Relations (Validation)
            const { data: deepPO, error: deepError } = await supabase
                .from('purchase_orders')
                .select(`
                    orders!original_order_id (
                        id,
                        cart:carts (
                            cart_items (
                                name, quantity
                            )
                        )
                    )
                `)
                .eq('id', po.id)
                .single();

            if (deepError) throw deepError;

            const items = (deepPO as any)?.orders?.cart?.cart_items;
            setLog(prev => prev + `Source Cart Items Available: ${Array.isArray(items) ? items.length : 0}\n`);

        } catch (err: any) {
            console.error(err);
            setLog(prev => prev + `Error: ${err.message || JSON.stringify(err)}\n`);
        }
    };

    const handleForceCreate = async () => {
        if (!foundPO) return;
        setLog(prev => prev + `\nAttempting to Force Create Billable Items for ${foundPO.id}...\n`);
        try {
            await billbackService.createBillableItemsFromPurchaseOrder(foundPO.id);
            setLog(prev => prev + `SUCCESS! Items created. Refresh the list to see them.\n`);
            runDebug(); // Refresh stats
        } catch (err: any) {
            setLog(prev => prev + `FAILED: ${err.message}\n`);
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-lg my-4 border border-red-500">
            <h3 className="font-bold text-red-600">Billback Debugger</h3>
            <div className="flex gap-2 mt-2">
                <button onClick={runDebug} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-black">
                    Run Diagnostics
                </button>
                {foundPO && (existingBillableCount === 0 || existingBillableCount === null) && (
                    <button onClick={handleForceCreate} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 animate-pulse font-bold">
                        Fix Missing Items (Force Create)
                    </button>
                )}
            </div>
            <pre className="mt-2 p-2 bg-black text-green-400 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                {log}
            </pre>
        </div>
    );
};

export default DebugBillback;
