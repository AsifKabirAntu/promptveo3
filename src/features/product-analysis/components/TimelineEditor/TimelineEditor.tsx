'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Trash2, 
  Edit3, 
  Move,
  Clock,
  Camera,
  Eye,
  Sparkles,
  Save,
  Undo,
  Redo
} from 'lucide-react'

interface TimelineSegment {
  id: string
  timestamp: string
  action: string
  camera: string
  focus: string
  duration: number
  startTime: number
}

interface TimelineEditorProps {
  initialTimeline: any[]
  totalDuration: number
  onSave: (timeline: TimelineSegment[]) => void
  onPreview?: (timeline: TimelineSegment[]) => void
}

export function TimelineEditor({ 
  initialTimeline, 
  totalDuration = 10, 
  onSave, 
  onPreview 
}: TimelineEditorProps) {
  const [timeline, setTimeline] = useState<TimelineSegment[]>(() => 
    initialTimeline.map((item, index) => ({
      id: `segment-${index}`,
      timestamp: item.timestamp,
      action: item.action,
      camera: item.camera,
      focus: item.focus,
      duration: parseDuration(item.timestamp),
      startTime: parseStartTime(item.timestamp)
    }))
  )
  
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [history, setHistory] = useState<TimelineSegment[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDragging, setIsDragging] = useState(false)

  const timelineRef = useRef<HTMLDivElement>(null)
  const playbackRef = useRef<NodeJS.Timeout | null>(null)

  // Helper functions
  function parseDuration(timestamp: string): number {
    const match = timestamp.match(/(\d+)-(\d+)s/)
    if (match) {
      return parseInt(match[2]) - parseInt(match[1])
    }
    return 1
  }

  function parseStartTime(timestamp: string): number {
    const match = timestamp.match(/(\d+)-(\d+)s/)
    if (match) {
      return parseInt(match[1])
    }
    return 0
  }

  function formatTimestamp(startTime: number, duration: number): string {
    return `${startTime}-${startTime + duration}s`
  }

  // History management
  const saveToHistory = (newTimeline: TimelineSegment[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...timeline])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setTimeline(newTimeline)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTimeline([...history[historyIndex - 1]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTimeline([...history[historyIndex + 1]])
    }
  }

  // Playback controls
  const togglePlayback = () => {
    if (isPlaying) {
      if (playbackRef.current) {
        clearInterval(playbackRef.current)
        playbackRef.current = null
      }
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playbackRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false)
            if (playbackRef.current) {
              clearInterval(playbackRef.current)
              playbackRef.current = null
            }
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    }
  }

  const seekTo = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(totalDuration, time)))
  }

  // Timeline manipulation
  const addSegment = () => {
    const lastSegment = timeline[timeline.length - 1]
    const startTime = lastSegment ? lastSegment.startTime + lastSegment.duration : 0
    
    if (startTime >= totalDuration) return

    const newSegment: TimelineSegment = {
      id: `segment-${Date.now()}`,
      timestamp: formatTimestamp(startTime, Math.min(2, totalDuration - startTime)),
      action: 'New scene description',
      camera: 'Camera movement',
      focus: 'Focus point',
      duration: Math.min(2, totalDuration - startTime),
      startTime
    }

    const newTimeline = [...timeline, newSegment]
    saveToHistory(newTimeline)
  }

  const updateSegment = (id: string, updates: Partial<TimelineSegment>) => {
    const newTimeline = timeline.map(segment => {
      if (segment.id === id) {
        const updated = { ...segment, ...updates }
        if (updates.duration || updates.startTime) {
          updated.timestamp = formatTimestamp(updated.startTime, updated.duration)
        }
        return updated
      }
      return segment
    })
    saveToHistory(newTimeline)
  }

  const deleteSegment = (id: string) => {
    const newTimeline = timeline.filter(segment => segment.id !== id)
    saveToHistory(newTimeline)
    setSelectedSegment(null)
  }

  // Visual timeline
  const timelineWidth = 800 // Fixed width for calculations
  const getSegmentPosition = (segment: TimelineSegment) => {
    const left = (segment.startTime / totalDuration) * timelineWidth
    const width = (segment.duration / totalDuration) * timelineWidth
    return { left, width }
  }

  const getCurrentSegment = () => {
    return timeline.find(segment => 
      currentTime >= segment.startTime && 
      currentTime < segment.startTime + segment.duration
    )
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current)
      }
    }
  }, [])

  const currentSegment = getCurrentSegment()

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Timeline Editor</h3>
          <Badge variant="outline" className="text-xs">
            {timeline.length} segments • {totalDuration}s total
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview?.(timeline)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(timeline)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Timeline
          </Button>
        </div>
      </div>

      {/* Playback Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekTo(0)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={togglePlayback}
              className="w-16"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekTo(totalDuration)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">
              {currentTime.toFixed(1)}s / {totalDuration}s
            </div>
            {currentSegment && (
              <div className="text-sm text-gray-600 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentSegment.action}
                </Badge>
              </div>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
            {/* Time markers */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: totalDuration + 1 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-gray-300 text-xs text-gray-500 pl-1"
                  style={{ minWidth: `${100 / (totalDuration + 1)}%` }}
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* Current time indicator */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 z-20"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            />

            {/* Clickable timeline */}
            <div
              className="absolute inset-0 cursor-pointer z-10"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                const newTime = (clickX / rect.width) * totalDuration
                seekTo(newTime)
              }}
            />
          </div>
        </div>
      </Card>

      {/* Visual Timeline */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Timeline Segments</h4>
            <Button
              size="sm"
              onClick={addSegment}
              disabled={timeline.length > 0 && timeline[timeline.length - 1].startTime + timeline[timeline.length - 1].duration >= totalDuration}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Segment
            </Button>
          </div>

          <div className="relative h-20 bg-gray-50 rounded-lg border overflow-hidden">
            {timeline.map((segment) => {
              const { left, width } = getSegmentPosition(segment)
              const isSelected = selectedSegment === segment.id
              const isCurrent = currentSegment?.id === segment.id

              return (
                <div
                  key={segment.id}
                  className={`absolute top-2 h-16 rounded border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-100 z-10'
                      : isCurrent
                      ? 'border-green-500 bg-green-100'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  onClick={() => setSelectedSegment(segment.id)}
                >
                  <div className="p-2 h-full overflow-hidden">
                    <div className="text-xs font-medium truncate">
                      {segment.action}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {segment.camera}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {segment.timestamp}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Segment Editor */}
      {selectedSegment && (
        <Card className="p-4">
          {(() => {
            const segment = timeline.find(s => s.id === selectedSegment)
            if (!segment) return null

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Segment
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSegment(segment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time (seconds)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={totalDuration - 1}
                      step="0.1"
                      value={segment.startTime}
                      onChange={(e) => updateSegment(segment.id, {
                        startTime: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Duration (seconds)
                    </label>
                    <Input
                      type="number"
                      min="0.1"
                      max={totalDuration - segment.startTime}
                      step="0.1"
                      value={segment.duration}
                      onChange={(e) => updateSegment(segment.id, {
                        duration: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Scene Action
                  </label>
                  <Textarea
                    value={segment.action}
                    onChange={(e) => updateSegment(segment.id, {
                      action: e.target.value
                    })}
                    rows={2}
                    placeholder="Describe what happens in this scene..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Camera className="w-4 h-4 inline mr-1" />
                      Camera Movement
                    </label>
                    <Input
                      value={segment.camera}
                      onChange={(e) => updateSegment(segment.id, {
                        camera: e.target.value
                      })}
                      placeholder="e.g., slow zoom, orbital, static"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Focus Point
                    </label>
                    <Input
                      value={segment.focus}
                      onChange={(e) => updateSegment(segment.id, {
                        focus: e.target.value
                      })}
                      placeholder="What to focus on in this segment"
                    />
                  </div>
                </div>
              </div>
            )
          })()}
        </Card>
      )}

      {/* Timeline Summary */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Timeline Summary</h4>
        <div className="space-y-2">
          {timeline.map((segment, index) => (
            <div
              key={segment.id}
              className={`flex items-center justify-between p-3 rounded border ${
                selectedSegment === segment.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              } cursor-pointer hover:border-gray-300`}
              onClick={() => setSelectedSegment(segment.id)}
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{segment.action}</p>
                  <p className="text-xs text-gray-600">
                    {segment.camera} • Focus: {segment.focus}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {segment.timestamp}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 