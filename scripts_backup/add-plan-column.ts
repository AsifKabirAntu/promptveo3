import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addPlanColumn() {
  try {
    console.log('Adding plan column to subscriptions table...')
    
    // Try to add the plan column directly
    const { error } = await supabase.rpc('exec_sql', { 
      sql: "ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro'))" 
    })
    
    if (error) {
      console.error('Error adding plan column:', error)
      console.log('The plan column might already exist or you may need to add it manually in the Supabase dashboard')
    } else {
      console.log('Successfully added plan column to subscriptions table')
    }
    
    // Test if we can query the subscriptions table
    const { data, error: testError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Error testing subscriptions table:', testError)
    } else {
      console.log('Subscriptions table is accessible')
    }
  } catch (error) {
    console.error('Error in addPlanColumn:', error)
  }
}

addPlanColumn() 