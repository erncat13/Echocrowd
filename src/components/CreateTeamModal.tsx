import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { api } from '../utils/api'

const TEAM_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F38181', '#95E1D3', '#FCE38A', '#C7CEEA'
]

interface CreateTeamModalProps {
  userId: string
  partyId: string
  isAdmin?: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateTeamModal({ userId, partyId, isAdmin, onClose, onCreated }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(TEAM_COLORS[0])
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxMembers, setMaxMembers] = useState(0)
  const [autoJoin, setAutoJoin] = useState(true)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name')
      return
    }

    setCreating(true)
    try {
      const result = await api.createTeam(partyId, userId, teamName, description, color, isPrivate, maxMembers, autoJoin)
      if (result.success) {
        onCreated()
        onClose()
      } else {
        alert('Error creating team: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating team:', error)
      alert('Error creating team')
    }
    setCreating(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Team 👥</DialogTitle>
          <DialogDescription>Start a new team and invite your friends to join.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Team Name */}
          <div>
            <Label>Team Name *</Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Alpha Squad"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this team for?"
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Color Selection */}
          <div>
            <Label>Team Color</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-12 h-12 rounded-lg transition-transform ${
                    color === c ? 'scale-110 ring-4 ring-purple-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Private Team</Label>
                <p className="text-xs text-muted-foreground">Only you can invite members</p>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <div>
              <Label>Max Members (0 = unlimited)</Label>
              <Input
                type="number"
                min={0}
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label>Auto Join</Label>
                  <p className="text-xs text-muted-foreground">Automatically join new members</p>
                </div>
                <Switch
                  checked={autoJoin}
                  onCheckedChange={setAutoJoin}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !teamName.trim()}
              className="flex-1"
              style={{ backgroundColor: color }}
            >
              {creating ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}