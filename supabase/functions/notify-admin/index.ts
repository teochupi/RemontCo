import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const ADMIN_EMAIL = 'chupetlov.teodor@gmail.com'
const SITE_URL = 'https://remontco.vercel.app'

interface CompanyPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    name: string
    email: string
    eik: string
    city: string
    verification_status: string
    created_at: string
  }
  old_record?: any
}

serve(async (req) => {
  try {
    const payload: CompanyPayload = await req.json()
    
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not an insert event' }), { status: 200 })
    }

    const company = payload.record

    const emailContent = {
      sender: { name: 'RemontCo', email: 'chupetlov.teodor@gmail.com' },
      to: [{ email: ADMIN_EMAIL, name: 'Admin' }],
      subject: `Нова фирма за верификация: ${company.name}`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4338CA, #312E81); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏢 Нова Фирма за Верификация</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">Детайли за фирмата:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Име:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${company.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">ЕИК/БУЛСТАТ:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${company.eik}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Имейл:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${company.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Град:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${company.city || 'Не е посочен'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b;">Регистрирана:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${new Date(company.created_at).toLocaleString('bg-BG')}</td>
              </tr>
            </table>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${SITE_URL}/dashboard/admin.html" 
                 style="display: inline-block; background: #4338CA; color: white; padding: 14px 32px; 
                        border-radius: 8px; text-decoration: none; font-weight: 600;">
                Отвори Админ Панела
              </a>
            </div>
          </div>
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              Това съобщение е автоматично генерирано от RemontCo
            </p>
          </div>
        </div>
      `
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!
      },
      body: JSON.stringify(emailContent)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Brevo API error:', error)
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, message: 'Admin notified' }), { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
