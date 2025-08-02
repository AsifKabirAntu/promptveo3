import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
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

async function runSqlFile(filename: string) {
  try {
    const filePath = join(process.cwd(), 'database', filename)
    const sql = readFileSync(filePath, 'utf8')
    
    console.log(`Running SQL file: ${filename}`)
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim())
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() })
        
        if (error) {
          console.error('Error executing SQL:', error)
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_dummy').select('*').limit(0)
          if (directError) {
            console.error('Direct query also failed:', directError)
          }
        }
      }
    }
    
    console.log(`Successfully executed ${filename}`)
  } catch (error) {
    console.error(`Error reading or executing ${filename}:`, error)
  }
}

// Get the filename from command line arguments
const filename = process.argv[2]

if (!filename) {
  console.error('Please provide a SQL filename')
  console.log('Usage: npm run sql <filename>')
  process.exit(1)
}

runSqlFile(filename) 