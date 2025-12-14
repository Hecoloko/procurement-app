
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const { dryRun } = await req.json().catch(() => ({ dryRun: false }))

        const today = new Date()
        const threeDaysFromNow = new Date(today)
        threeDaysFromNow.setDate(today.getDate() + 3)
        const oneDayAgo = new Date(today)
        oneDayAgo.setDate(today.getDate() - 1)

        const dueIn3DaysStr = threeDaysFromNow.toISOString().split('T')[0]
        const overdue1DayStr = oneDayAgo.toISOString().split('T')[0]

        const results = {
            upcoming: 0,
            overdue: 0,
            errors: [] as string[]
        }

        // 1. Fetch Invoices
        // We look for 'Sent' or 'Partially Paid' invoices
        const { data: invoices, error: dbError } = await supabase
            .from('invoices')
            .select('*, customer:customers(email, name)')
            .in('status', ['Sent', 'Partially Paid'])
            .or(`due_date.eq.${dueIn3DaysStr},due_date.eq.${overdue1DayStr}`)

        if (dbError) throw dbError

        console.log(`Found ${invoices?.length || 0} invoices to check.`)

        for (const invoice of (invoices || [])) {
            const isUpcoming = invoice.due_date === dueIn3DaysStr
            const isOverdue = invoice.due_date === overdue1DayStr
            const customerEmail = invoice.customer?.email

            if (!customerEmail) {
                console.warn(`Invoice ${invoice.invoice_number} has no customer email. Skipping.`)
                continue
            }

            let subject = ''
            let htmlBody = ''
            let activityType = ''
            let subType = ''

            const paymentLink = `https://procurement-qz8tmbr0h-hecolokos-projects.vercel.app/#/pay/${invoice.id}`

            if (isUpcoming) {
                subject = `Reminder: Invoice ${invoice.invoice_number} is due soon`
                htmlBody = `
                    <h1>Upcoming Invoice Reminder</h1>
                    <p>Dear ${invoice.customer?.name || 'Valued Customer'},</p>
                    <p>This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> for $${invoice.amount || invoice.total_amount} is due on ${invoice.due_date}.</p>
                    <p><a href="${paymentLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View and Pay Invoice</a></p>
                `
                activityType = 'EMAIL_SENT'
                subType = 'Upcoming Reminder'
                results.upcoming++
            } else if (isOverdue) {
                subject = `Overdue: Invoice ${invoice.invoice_number} was due yesterday`
                htmlBody = `
                    <h1>Invoice Overdue Notice</h1>
                    <p>Dear ${invoice.customer?.name || 'Valued Customer'},</p>
                    <p>We noticed that we haven't received payment for invoice <strong>${invoice.invoice_number}</strong> ($${invoice.amount || invoice.total_amount}) which was due on ${invoice.due_date}.</p>
                    <p>Please make payment at your earliest convenience to avoid any service interruption.</p>
                    <p><a href="${paymentLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Now</a></p>
                `
                activityType = 'EMAIL_SENT'
                subType = 'Overdue Notice'
                results.overdue++
            } else {
                continue
            }

            if (dryRun) {
                console.log(`[Dry Run] Would send "${subject}" to ${customerEmail}`)
                continue
            }

            // Send Email
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'Acme <onboarding@resend.dev>', // Replace with verified domain in prod
                    to: customerEmail,
                    subject: subject,
                    html: htmlBody,
                }),
            })

            if (!res.ok) {
                const err = await res.text()
                console.error(`Failed to send email for ${invoice.invoice_number}: ${err}`)
                results.errors.push(`Failed to send to ${customerEmail}: ${err}`)
                continue
            }

            // Log Activity
            await supabase.from('invoice_activities').insert({
                invoice_id: invoice.id,
                activity_type: activityType,
                description: `${subType} sent to ${customerEmail}`,
                metadata: {
                    recipient: customerEmail,
                    subject: subject,
                    trigger: isUpcoming ? 'upcoming_3_days' : 'overdue_1_day'
                }
            })
        }

        return new Response(JSON.stringify({
            message: 'Reminder check complete',
            processed: results,
            dryRun
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
