import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (user_id === callerUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('role, username, email')
      .eq('id', user_id)
      .single()

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (targetProfile.role === 'admin') {
      return new Response(
        JSON.stringify({ error: 'Cannot delete another admin account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin.from('quotes').delete().eq('offered_by', user_id)
    await supabaseAdmin.from('favorites').delete().eq('user_id', user_id)
    await supabaseAdmin.from('media').delete().eq('uploaded_by', user_id)
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${user_id},recipient_id.eq.${user_id}`)

    if (targetProfile.role === 'company') {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('owner_id', user_id)
        .single()

      if (company) {
        await supabaseAdmin.from('company_portfolio').delete().eq('company_id', company.id)
        await supabaseAdmin.from('company_services').delete().eq('company_id', company.id)
        await supabaseAdmin.from('company_members').delete().eq('company_id', company.id)
        await supabaseAdmin.from('quotes').delete().eq('company_id', company.id)
        await supabaseAdmin.from('companies').delete().eq('id', company.id)
      }
    }

    if (targetProfile.role === 'consumer') {
      const { data: jobs } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .eq('consumer_id', user_id)

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map(j => j.id)
        await supabaseAdmin.from('quotes').delete().in('job_id', jobIds)
        await supabaseAdmin.from('jobs').delete().eq('consumer_id', user_id)
      }
    }

    await supabaseAdmin.from('profiles').delete().eq('id', user_id)

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Profile deleted but auth cleanup may be incomplete',
          deleted_user: { username: targetProfile.username, email: targetProfile.email, role: targetProfile.role }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all associated data deleted successfully',
        deleted_user: { username: targetProfile.username, email: targetProfile.email, role: targetProfile.role }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
