import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Sparkles, Camera } from 'lucide-react'
import { api } from '../utils/api'

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
]

const RANDOM_ADJECTIVES = ['Cool', 'Epic', 'Mega', 'Super', 'Ultra', 'Happy', 'Wild', 'Brave']
const RANDOM_NOUNS = ['Ninja', 'Dragon', 'Tiger', 'Phoenix', 'Falcon', 'Wolf', 'Bear', 'Eagle']

interface UsernameSetupProps {
  onComplete: (userId: string, username: string, color: string, profilePicture: string) => void
}

export function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState('')
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])
  const [profilePicture, setProfilePicture] = useState('')
  const [uploading, setUploading] = useState(false)

  const generateRandomUsername = () => {
    const adjective = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)]
    const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)]
    const number = Math.floor(Math.random() * 100)
    setUsername(`${adjective}${noun}${number}`)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await api.uploadImage(file, 'profiles')
      if (result.success) {
        setProfilePicture(result.url)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
    setUploading(false)
  }

  const handleContinue = async () => {
    if (username.length < 3) {
      alert('Username must be at least 3 characters')
      return
    }

    const userId = crypto.randomUUID()
    
    try {
      await api.saveUser(userId, username, selectedColor, profilePicture)
      
      // Save to localStorage as well
      localStorage.setItem('userId', userId)
      localStorage.setItem('username', username)
      localStorage.setItem('avatarColor', selectedColor)
      localStorage.setItem('profilePicture', profilePicture)
      
      onComplete(userId, username, selectedColor, profilePicture)
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🎉 WalkyTalky</h1>
          <p className="text-muted-foreground">Create your identity</p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer group"
              style={{ backgroundColor: profilePicture ? 'transparent' : selectedColor }}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-3xl">{username.slice(0, 2).toUpperCase() || '?'}</span>
              )}
              <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <label className="block">Username</label>
            <div className="flex gap-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="flex-1"
                minLength={3}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomUsername}
                title="Generate random username"
              >
                <Sparkles size={18} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="block">Avatar Color</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    selectedColor === color ? 'scale-110 ring-4 ring-purple-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
            onClick={handleContinue}
            disabled={username.length < 3}
          >
            Let's Vibe! 🚀
          </Button>
        </div>
      </div>
    </div>
  )
}
