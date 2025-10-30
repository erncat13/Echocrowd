import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Camera } from 'lucide-react'
import { api } from '../utils/api'

interface CreatePartyModalProps {
  userId: string
  onClose: () => void
  onCreated: (partyId: string) => void
}

export function CreatePartyModal({ userId, onClose, onCreated }: CreatePartyModalProps) {
  const [partyName, setPartyName] = useState('')
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState('')
  const [password, setPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [settings, setSettings] = useState({
    membersCanSeeJoinCodes: false,
    allowMultipleTeams: true,
    maxTeamsPerUser: 3,
    membersCanCreateTeams: true,
    maxMembers: 0,
    voiceChatEnabled: true,
    imageShareEnabled: true,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await api.uploadImage(file, 'banners')
      if (result.success) {
        setBanner(result.url)
      }
    } catch (error) {
      console.error('Error uploading banner:', error)
    }
    setUploading(false)
  }

  const handleCreate = async () => {
    if (!partyName.trim()) {
      alert('Please enter a party name')
      return
    }

    setCreating(true)
    try {
      const result = await api.createParty(userId, partyName, description, banner, settings, password || undefined)
      if (result.success) {
        onCreated(result.partyId)
        onClose()
      } else {
        alert('Error creating party: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating party:', error)
      alert('Error creating party')
    }
    setCreating(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Party 🎉</DialogTitle>
          <DialogDescription>Start a new party and invite your friends!</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Banner */}
          <div>
            <Label>Party Banner (Optional)</Label>
            <div className="mt-2">
              {banner ? (
                <div className="relative">
                  <img src={banner} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setBanner('')}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <Camera size={32} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
            </div>
          </div>

          {/* Party Name */}
          <div>
            <Label>Party Name *</Label>
            <Input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Epic Gaming Night"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this party about?"
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Password */}
          <div>
            <Label>Password (Optional)</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password to secure your party"
              className="mt-2"
              type="password"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3>Party Settings</h3>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Members can see join codes</Label>
                <p className="text-xs text-muted-foreground">Allow regular members to view codes</p>
              </div>
              <Switch
                checked={settings.membersCanSeeJoinCodes}
                onCheckedChange={(checked) => setSettings({ ...settings, membersCanSeeJoinCodes: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Allow multiple teams</Label>
                <p className="text-xs text-muted-foreground">Members can join more than one team</p>
              </div>
              <Switch
                checked={settings.allowMultipleTeams}
                onCheckedChange={(checked) => setSettings({ ...settings, allowMultipleTeams: checked })}
              />
            </div>

            {settings.allowMultipleTeams && (
              <div>
                <Label>Max teams per user</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.maxTeamsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxTeamsPerUser: parseInt(e.target.value) || 1 })}
                  className="mt-2"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Members can create teams</Label>
                <p className="text-xs text-muted-foreground">Allow everyone to create teams</p>
              </div>
              <Switch
                checked={settings.membersCanCreateTeams}
                onCheckedChange={(checked) => setSettings({ ...settings, membersCanCreateTeams: checked })}
              />
            </div>

            <div>
              <Label>Max members (0 = unlimited)</Label>
              <Input
                type="number"
                min={0}
                value={settings.maxMembers}
                onChange={(e) => setSettings({ ...settings, maxMembers: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Voice chat enabled</Label>
                <p className="text-xs text-muted-foreground">Enable walkie-talkie voice features</p>
              </div>
              <Switch
                checked={settings.voiceChatEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, voiceChatEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Image sharing enabled</Label>
                <p className="text-xs text-muted-foreground">Allow members to share images</p>
              </div>
              <Switch
                checked={settings.imageShareEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, imageShareEnabled: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !partyName.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {creating ? 'Creating...' : 'Create Party'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}