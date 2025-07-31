import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createEmailSubscriptionsTable() {
  try {
    console.log('Creating email_subscriptions table...')
    
    // Read the SQL file
    const filePath = join(process.cwd(), 'database', 'email-subscriptions.sql')
    const sql = readFileSync(filePath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error('Error executing statement:', error)
          console.error('Statement:', statement)
        } else {
          console.log('✓ Statement executed successfully')
        }
      }
    }
    
    console.log('✅ Email subscriptions table created successfully!')
  } catch (error) {
    console.error('Error creating email subscriptions table:', error)
  }
}

createEmailSubscriptionsTable() 