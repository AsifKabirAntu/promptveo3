import { readFileSync, existsSync } from 'fs'
import { join, isAbsolute } from 'path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!baseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

async function main() {
  const argPath = process.argv[2]
  const filename = argPath && argPath.trim().length > 0 ? argPath.trim() : 'exploded_build_prompts.json'
  const absolutePath = isAbsolute(filename) ? filename : join(process.cwd(), 'data', filename)
  if (!existsSync(absolutePath)) {
    console.error(`Input file not found: ${absolutePath}`)
    process.exit(1)
  }

  const raw = readFileSync(absolutePath, 'utf8')
  const items = JSON.parse(raw)

  const endpoint = `${baseUrl}/rest/v1/exploded_build_prompts`

  for (const item of items) {
    const payload = {
      title: item.title,
      description: item.description,
      category: item.category || 'Exploaded Build',
      shot: item.shot,
      subject: item.subject,
      scene: item.scene,
      visual_details: item.visual_details,
      cinematography: item.cinematography,
      audio: item.audio,
      dialogue: item.dialogue,
      is_public: true,
    }

    const headers = new Headers()
    headers.set('apikey', serviceKey!)
    headers.set('Authorization', `Bearer ${serviceKey!}`)
    headers.set('Content-Type', 'application/json')
    headers.set('Prefer', 'return=representation')

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Failed to insert:', item.title, res.status, text)
      process.exitCode = 1
    } else {
      const json = await res.json()
      console.log('Inserted:', json[0]?.id, item.title)
    }
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}) 