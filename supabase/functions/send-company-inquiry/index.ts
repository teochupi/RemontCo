import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SENDER_EMAIL = "chupetlov.teodor@gmail.com"; // Using system sender

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InquiryRequest {
    company_id: string;
    sender_name: string;
    sender_email: string;
    sender_phone: string;
    message: string;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { company_id, sender_name, sender_email, sender_phone, message } = await req.json() as InquiryRequest;

        if (!company_id || !sender_email || !message) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch Company Email
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('name, email')
            .eq('id', company_id)
            .single();

        if (companyError || !company || !company.email) {
            return new Response(JSON.stringify({ error: "Company not found or has no email" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404
            });
        }

        // 2. Prepare Email via Brevo
        const emailData = {
            sender: { name: "RemontCo Platform", email: SENDER_EMAIL },
            to: [{ email: company.email, name: company.name }],
            replyTo: { email: sender_email, name: sender_name },
            subject: `Ново запитване от ${sender_name} през RemontCo`,
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Ново запитване за работа</h2>
            <p>Здравейте, <strong>${company.name}</strong>,</p>
            <p>Получихте ново запитване от потребител на платформата RemontCo.</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Данни за контакт:</h3>
                <p style="margin: 5px 0;"><strong>Име:</strong> ${sender_name}</p>
                <p style="margin: 5px 0;"><strong>Имейл:</strong> <a href="mailto:${sender_email}">${sender_email}</a></p>
                <p style="margin: 5px 0;"><strong>Телефон:</strong> ${sender_phone || 'Не е посочен'}</p>
                
                <h3 style="margin-top: 15px; color: #1f2937;">Съобщение:</h3>
                <p style="white-space: pre-wrap; background: #fff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px;">${message}</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="mailto:${sender_email}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Отговори на имейла</a>
            </div>
            
            <p style="font-size: 12px; color: #6b7280; margin-top: 30px; text-align: center;">
                RemontCo Platform<br>
                Това е автоматично съобщение. Можете да отговорите директно на този имейл, за да се свържете с клиента.
            </p>
        </div>
      `
        };

        // 3. Send Email
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY!,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!brevoResponse.ok) {
            const txt = await brevoResponse.text();
            console.error("Brevo Error:", txt);
            return new Response(JSON.stringify({ error: "Failed to send email", details: txt }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            });
        }

        return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err) {
        console.error("Function Error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
