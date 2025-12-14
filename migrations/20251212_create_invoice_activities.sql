-- Create invoice_activities table for tracking history
CREATE TABLE IF NOT EXISTS public.invoice_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'EMAIL_SENT', 'STATUS_CHANGE', 'PAYMENT_RECEIVED', 'VIEWED'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id), -- Optional: who triggered it
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.invoice_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their company" ON public.invoice_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE public.invoices.id = public.invoice_activities.invoice_id
            AND public.invoices.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert activities for their company invoices" ON public.invoice_activities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE public.invoices.id = public.invoice_activities.invoice_id
            AND public.invoices.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()::text)
        )
    );
