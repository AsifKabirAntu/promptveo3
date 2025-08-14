import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    
    // Construct the path to the thumbnail
    const thumbnailPath = join(process.cwd(), 'data', 'ulazai-thumbnails', filename)
    
    // Check if the thumbnail exists
    if (!existsSync(thumbnailPath)) {
      return new NextResponse('Thumbnail not found', { status: 404 })
    }
    
    // Read the thumbnail file
    const thumbnailBuffer = await readFile(thumbnailPath)
    
    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg'
        case 'png':
          return 'image/png'
        case 'webp':
          return 'image/webp'
        case 'gif':
          return 'image/gif'
        default:
          return 'image/jpeg'
      }
    }
    
    // Set appropriate headers for image serving
    const headers = new Headers()
    headers.set('Content-Type', getContentType(filename))
    headers.set('Content-Length', thumbnailBuffer.length.toString())
    headers.set('Cache-Control', 'public, max-age=31536000, immutable') // Cache for 1 year
    
    return new NextResponse(thumbnailBuffer, { headers })
  } catch (error) {
    console.error('Error serving thumbnail:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 