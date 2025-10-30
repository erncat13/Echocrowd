import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ArrowLeft, Send, Paperclip, Mic, X, Crown, Settings } from 'lucide-react'
import { api } from '../utils/api'
import { Badge } from './ui/badge'
import { AdminSettings } from './AdminSettings'

interface TeamChatProps {
  userId: string
  partyId: string
  chatId: string
  chatName: string
  chatColor: string
  onBack: () => void
}

export function TeamChat({ userId, partyId, chatId, chatName, chatColor, onBack }: TeamChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map())
  const [party, setParty] = useState<any>(null)
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  
  // Walkie-talkie state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    try {
      const result = await api.getMessages(partyId, chatId)
      if (result.success) {
        setMessages(result.messages || [])
        
        // Load user profiles for new users
        const newProfiles = new Map(userProfiles)
        for (const msg of result.messages || []) {
          if (!newProfiles.has(msg.userId)) {
            const userResult = await api.getUser(msg.userId)
            if (userResult.success && userResult.user) {
              newProfiles.set(msg.userId, userResult.user)
            }
          }
        }
        setUserProfiles(newProfiles)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadParty = async () => {
    try {
      const result = await api.getParty(partyId)
      if (result.success) {
        setParty(result.party)
      }
    } catch (error) {
      console.error('Error loading party:', error)
    }
  }

  useEffect(() => {
    loadMessages()
    loadParty()
    const interval = setInterval(loadMessages, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [partyId, chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    setSending(true)
    try {
      const result = await api.sendMessage(partyId, userId, chatId, inputText)
      if (result.success) {
        setInputText('')
        await loadMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
    setSending(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadResult = await api.uploadImage(file, 'chat-images')
      if (uploadResult.success) {
        const result = await api.sendMessage(partyId, userId, chatId, '', uploadResult.url)
        if (result.success) {
          await loadMessages()
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
    setUploading(false)
  }

  // Walkie-talkie functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadAndSendAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      audioChunksRef.current = []
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const uploadAndSendAudio = async (audioBlob: Blob) => {
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
      const uploadResult = await api.uploadImage(file, 'voice-messages')
      
      if (uploadResult.success) {
        await api.sendMessage(partyId, userId, chatId, '[Voice Message]', uploadResult.url)
        await loadMessages()
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentUserProfile = userProfiles.get(userId)
  const voiceChatEnabled = party?.settings?.voiceChatEnabled !== false
  const imageShareEnabled = party?.settings?.imageShareEnabled !== false

  const isAdmin = party?.adminIds?.includes(userId)

  // Show admin settings if requested
  if (showAdminSettings) {
    return <AdminSettings userId={userId} partyId={partyId} onBack={() => setShowAdminSettings(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div 
        className="p-4 shadow-md flex items-center gap-4 text-white"
        style={{ backgroundColor: chatColor }}
      >
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-white">{chatName}</h2>
          <p className="text-sm text-white/80">{chatId === 'everyone' ? 'Public Chat' : 'Team Chat'}</p>
        </div>
      </div>

      {/* Admin Bar */}
      {isAdmin && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">ADMIN</Badge>
              <p className="text-sm text-yellow-800">You have admin privileges</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminSettings(true)}
              className="bg-white"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const profile = userProfiles.get(msg.userId)
          const isCurrentUser = msg.userId === userId
          const isVoiceMessage = msg.content === '[Voice Message]' && msg.imageUrl
          const isSenderAdmin = party?.adminIds?.includes(msg.userId)

          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {!isCurrentUser && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: profile?.profilePicture ? 'transparent' : (profile?.color || '#888') }}
                  >
                    {profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xs">
                        {profile?.username?.slice(0, 2).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                )}

                {/* Message */}
                <div>
                  {!isCurrentUser && (
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs text-muted-foreground">{profile?.username || 'Unknown'}</p>
                      {isSenderAdmin && <Crown className="text-yellow-500" size={12} />}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-3 ${
                      isCurrentUser 
                        ? 'text-white' 
                        : 'bg-white'
                    }`}
                    style={isCurrentUser ? { backgroundColor: chatColor } : {}}
                  >
                    {isVoiceMessage ? (
                      <div className="flex items-center gap-2">
                        <Mic size={16} />
                        <audio src={msg.imageUrl} controls className="max-w-full" />
                      </div>
                    ) : msg.imageUrl ? (
                      <img src={msg.imageUrl} alt="Shared image" className="rounded-lg max-w-full" />
                    ) : (
                      <p className={isCurrentUser ? 'text-white' : ''}>{msg.content}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Walkie-Talkie Recording Overlay */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <Mic size={48} className="text-white" />
              </div>
            </div>
            <p className="text-white text-2xl mb-2">Recording...</p>
            <p className="text-white/80 text-xl mb-6">{formatTime(recordingTime)}</p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={cancelRecording}
                className="bg-white"
              >
                <X size={20} className="mr-2" />
                Cancel
              </Button>
              <Button
                onClick={stopRecording}
                className="bg-green-500 hover:bg-green-600"
              >
                Send Voice Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        {/* Walkie-Talkie Button */}
        {voiceChatEnabled && (
          <div className="mb-3">
            <Button
              className="w-full h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-xl"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isRecording}
            >
              <Mic size={24} className="mr-2" />
              {isRecording ? 'Recording...' : 'Hold to Talk (Walkie-Talkie)'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Press and hold to record, release to send
            </p>
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          {imageShareEnabled && (
            <label>
              <Button variant="outline" size="icon" disabled={uploading} asChild>
                <span>
                  <Paperclip size={20} />
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
          
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={sending || !inputText.trim()}
            style={{ backgroundColor: chatColor }}
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  )
}