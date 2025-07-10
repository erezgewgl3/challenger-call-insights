import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Permanent user deletion function called')

  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { userId, userIds, adminId } = requestBody
    
    // Simple deletion for now - just delete the user record
    if (userId) {
      console.log(`Deleting user: ${userId}`)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
      console.log('User deleted successfully')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: 1,
          message: 'User deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userIds && Array.isArray(userIds)) {
      console.log(`Deleting ${userIds.length} users`)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', userIds)
      
      if (error) {
        console.error('Bulk delete error:', error)
        throw error
      }
      
      console.log('Users deleted successfully')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: userIds.length,
          message: 'Users deleted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Either userId or userIds must be provided')

  } catch (error) {
    console.error('Error in permanent-user-deletion:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})