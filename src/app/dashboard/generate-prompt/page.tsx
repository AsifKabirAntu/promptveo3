'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Copy, Download, Heart, Plus, MessageSquare, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Shimmer component for loading state
function ShimmerLoader() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  promptData?: any
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

export default function GeneratePromptPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [user, setUser] = useState<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const currentMessages = currentSession?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages])

  // Check authentication and load sessions
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await loadSessions()
      }
      setIsLoadingSessions(false)
    }
    
    checkAuth()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions')
      if (response.ok) {
        const data = await response.json()
        const formattedSessions = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          messages: [], // Will be loaded when session is selected
          createdAt: new Date(session.createdAt)
        }))
        setSessions(formattedSessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.messages.map((message: any) => ({
          id: message.id,
          type: message.type,
          content: message.content,
          promptData: message.promptData,
          timestamp: new Date(message.timestamp)
        }))
        
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, messages: formattedMessages }
            : session
        ))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const saveMessage = async (sessionId: string, type: 'user' | 'assistant', content: string, promptData?: any) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          promptData
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save message')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  }

  const createSession = async (title: string) => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create session')
      }
      
      const data = await response.json()
      return {
        id: data.session.id,
        title: data.session.title,
        messages: [],
        createdAt: new Date(data.session.createdAt)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  const createNewSession = async () => {
    try {
      const newSession = await createSession('New Prompt Generation')
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(newSession.id)
    } catch (error) {
      console.error('Error creating new session:', error)
    }
  }

  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    const session = sessions.find(s => s.id === sessionId)
    if (session && session.messages.length === 0) {
      await loadMessages(sessionId)
    }
  }

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent session selection when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove session from state
        setSessions(prev => prev.filter(session => session.id !== sessionId))
        
        // If deleted session was current, clear current session
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null)
        }
      } else {
        throw new Error('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  const updateSessionTitle = (sessionId: string, firstUserMessage: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : '') }
        : session
    ))
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return

    const userInputText = input.trim()
    setInput('')
    setIsLoading(true)

    let sessionId = currentSessionId

    try {
      if (!sessionId) {
        const newSession = await createSession(userInputText.slice(0, 50) + (userInputText.length > 50 ? '...' : ''))
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
        sessionId = newSession.id
      }

      // Save user message to Supabase
      if (!sessionId) throw new Error('Session ID is required')
      const savedUserMessage = await saveMessage(sessionId, 'user', userInputText)
      
      const userMessage: ChatMessage = {
        id: savedUserMessage.message.id,
        type: 'user',
        content: userInputText,
        timestamp: new Date(savedUserMessage.message.timestamp)
      }

      // Add user message to UI immediately
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      ))

      console.log('Sending request:', { userRequest: userInputText, conversationHistory: currentMessages })
      
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: userInputText,
          conversationHistory: currentMessages
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to generate prompt: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received data:', data)

      // Save assistant message to Supabase
      if (!sessionId) throw new Error('Session ID is required')
      const savedAssistantMessage = await saveMessage(
        sessionId, 
        'assistant', 
        data.explanation || 'Generated professional Veo 3 prompt based on your request.',
        data.prompt
      )

      const assistantMessage: ChatMessage = {
        id: savedAssistantMessage.message.id,
        type: 'assistant',
        content: data.explanation || 'Generated professional Veo 3 prompt based on your request.',
        timestamp: new Date(savedAssistantMessage.message.timestamp),
        promptData: data.prompt
      }

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages: [...session.messages, assistantMessage] }
          : session
      ))

    } catch (error) {
      console.error('Error generating prompt:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, there was an error generating your prompt. Please try again.',
        timestamp: new Date()
      }

      // Save error message to Supabase if we have a sessionId
      if (sessionId) {
        try {
          await saveMessage(sessionId, 'assistant', errorMessage.content)
        } catch (saveError) {
          console.error('Error saving error message:', saveError)
        }

        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session
        ))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const saveToFavorites = async (promptData: any) => {
    try {
      // Implement save to favorites functionality
      console.log('Saving to favorites:', promptData)
    } catch (error) {
      console.error('Error saving to favorites:', error)
    }
  }

  // Show loading while checking authentication
  if (isLoadingSessions) {
    return (
      <div className="flex h-[100dvh] bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="flex h-[100dvh] bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access the Veo 3 Prompt Generator
          </p>
          <Button 
            onClick={() => window.location.href = '/auth/signin'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] bg-gray-50">
      {/* Secondary Sidebar - Chat History */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={createNewSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate New
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs">Click "Generate New" to start</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`relative p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600"
                  title="Delete conversation"
                >
                  <X className="w-3 h-3" />
                </button>

                <p className="text-sm font-medium text-gray-900 line-clamp-2 pr-6">
                  {session.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {session.createdAt.toLocaleDateString()}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {session.messages.length} messages
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Veo 3 Prompt Generator</h1>
              <p className="text-sm text-gray-500">Describe your video idea and get a professional Veo 3 prompt</p>
            </div>
          </div>
        </div>

                {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {currentMessages.length === 0 && !isLoading ? (
            /* Centered Initial State */
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="text-center mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> "Create a corporate video for LinkedIn featuring our CEO discussing our new AI product launch for enterprise decision-makers"
                  </p>
                </div>
              </div>

              {/* Centered Input Area */}
              <div className="w-full">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your video idea... (e.g., 'Create a social media video for TikTok showing a tech review')"
                      className="min-h-[60px] max-h-32 resize-none pr-12"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          ) : (
            /* Chat View with Messages */
            <>
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl p-4 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {/* Prompt Data Display */}
                        {message.promptData && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">Generated Veo 3 Prompt</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(JSON.stringify(message.promptData, null, 2))}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy JSON
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadAsJson(message.promptData, `veo3-prompt-${Date.now()}`)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveToFavorites(message.promptData)}
                                >
                                  <Heart className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                            </div>
                            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-gray-800">
                              {JSON.stringify(message.promptData, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading shimmer effect */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-3xl p-4 rounded-lg bg-white border border-gray-200">
                        <ShimmerLoader />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Bottom Input Area (Chat Mode) */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe your video idea... (e.g., 'Create a social media video for TikTok showing a tech review')"
                        className="min-h-[60px] max-h-32 resize-none pr-12"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 