import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { api } from '../utils/api'

interface JoinPartyModalProps {
  userId: string
  onClose: () => void
  onJoined: (partyId: string) => void
}

export function JoinPartyModal({ userId, onClose, onJoined }: JoinPartyModalProps) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    if (code.length !== 6) {
      alert('Code must be 6 characters')
      return
    }

    setJoining(true)
    try {
      const result = await api.joinParty(userId, code.toUpperCase(), password || undefined)
      if (result.success) {
        onJoined(result.partyId)
        onClose()
      } else {
        if (result.requiresPassword && !password) {
          setRequiresPassword(true)
          alert('This party requires a password')
        } else {
          alert('Error: ' + result.error)
        }
      }
    } catch (error) {
      console.error('Error joining party:', error)
      alert('Error joining party')
    }
    setJoining(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join Party 🎊</DialogTitle>
          <DialogDescription>Enter the 6-character code from the party admin</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="block mb-2">Enter Party Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {requiresPassword && (
            <div>
              <label className="block mb-2">Party Password</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
              />
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="mb-2">Code Types</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Everyone Code</strong>: Reusable, share with anyone</li>
              <li>• <strong>Single-Use Code</strong>: Works once, then expires</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={joining || code.length !== 6}
              className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500"
            >
              {joining ? 'Joining...' : 'Join Party'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}