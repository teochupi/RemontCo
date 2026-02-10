// NOTE: This Edge Function is OPTIONAL and NOT NEEDED
// The SQL trigger in database/prevent_demo_password_change.sql is sufficient
// This file is kept for reference only

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const DEMO_EMAILS = [
    'demo@remont.co',
    'company-demo@remont.co'
]

interface WebhookPayload {
    type: string
    table: string
    record: {
        id: string
        email: string
    }
    old_record?: {
        id: string
        email: string
    }
}

serve(async (req: Request) => {
    try {
        const payload: WebhookPayload = await req.json()

        console.log('Webhook received:', payload.type, payload.record?.email)

        // This function would need to be triggered by a database webhook
        // However, the SQL trigger is a better solution as it runs directly in the database

        // Check if email is a demo account
        const email = payload.record?.email?.toLowerCase()

        if (email && DEMO_EMAILS.includes(email)) {
            console.log(`Demo account detected: ${email}`)

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Demo account detected - protected by SQL trigger',
                    email: email
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Event processed' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        console.error('Error in prevent-demo-password-change:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})
