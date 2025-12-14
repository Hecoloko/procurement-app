
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, invoiceId, customerId, amount, currency } = await req.json()

        if (action === 'create-payment-intent') {
            // @ts-ignore
            const Stripe = (await import('https://esm.sh/stripe@14.10.0?target=deno')).default;
            const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
                apiVersion: '2023-10-16',
                httpClient: Stripe.createFetchHttpClient(),
            })

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // convert to cents
                currency: currency || 'usd',
                automatic_payment_methods: { enabled: true },
                metadata: {
                    invoiceId: invoiceId,
                    companyId: 'comp-1', // Todo: pass actual companyId
                    customerId: customerId
                }
            })

            return new Response(
                JSON.stringify({ clientSecret: paymentIntent.client_secret }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'finalize') {
            const { data: invoice, error } = await supabase
                .from('invoices')
                .update({ status: 'Sent' })
                .eq('id', invoiceId)
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ message: 'Invoice finalized', invoice }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ message: 'Unknown action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
