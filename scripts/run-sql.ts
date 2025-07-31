import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

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
    
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('Error executing SQL:', error)
    } else {
      console.log(`Successfully executed ${filename}`)
    }
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