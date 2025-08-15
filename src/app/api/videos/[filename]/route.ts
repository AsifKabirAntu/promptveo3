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
    
    // Priority: intelligent > branded > clean > original
    const intelligentFilename = filename.replace('.mp4', '-intelligent.mp4')
    const brandedFilename = filename.replace('.mp4', '-branded.mp4')
    const cleanFilename = filename.replace('.mp4', '-clean.mp4')
    const intelligentVideoPath = join(process.cwd(), 'data', 'promptveo3-intelligent-branded', intelligentFilename)
    const brandedVideoPath = join(process.cwd(), 'data', 'promptveo3-branded', brandedFilename)
    const cleanVideoPath = join(process.cwd(), 'data', 'ulazai-videos-clean', cleanFilename)
    const originalVideoPath = join(process.cwd(), 'data', 'ulazai-videos', filename)
    
    let videoPath = originalVideoPath
    
    // Prefer intelligent > branded > clean > original
    if (existsSync(intelligentVideoPath)) {
      videoPath = intelligentVideoPath
      console.log('Serving intelligent video:', intelligentFilename)
    } else if (existsSync(brandedVideoPath)) {
      videoPath = brandedVideoPath
      console.log('Serving branded video:', brandedFilename)
    } else if (existsSync(cleanVideoPath)) {
      videoPath = cleanVideoPath
      console.log('Serving clean video:', cleanFilename)
    } else if (!existsSync(originalVideoPath)) {
      return new NextResponse('Video not found', { status: 404 })
    }
    
    // Read the video file
    const videoBuffer = await readFile(videoPath)
    
    // Set appropriate headers for video streaming
    const headers = new Headers()
    headers.set('Content-Type', 'video/mp4')
    headers.set('Content-Length', videoBuffer.length.toString())
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=86400') // Cache for 1 day
    
    return new NextResponse(videoBuffer as BodyInit, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error serving video:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 