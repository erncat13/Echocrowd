import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react'
import { api } from '../utils/api'

interface AdminSettingsProps {
  userId: string
  partyId: string
  onBack: () => void
}

export function AdminSettings({ userId, partyId, onBack }: AdminSettingsProps) {
  const [party, setParty] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map())
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const loadParty = async () => {
    try {
      const result = await api.getParty(partyId)
      if (result.success) {
        setParty(result.party)
        setSettings(result.party.settings)
        setPassword(result.party.password || '')
        setMembers(result.members || [])
        
        // Load user profiles
        const profiles = new Map()
        for (const member of result.members || []) {
          const userResult = await api.getUser(member.userId)
          if (userResult.success && userResult.user) {
            profiles.set(member.userId, userResult.user)
          }
        }
        setUserProfiles(profiles)
      }
    } catch (error) {
      console.error('Error loading party:', error)
    }
  }

  useEffect(() => {
    loadParty()
  }, [partyId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await api.updatePartySettings(partyId, userId, settings)
      if (result.success) {
        alert('Settings saved!')
        await loadParty()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
    setSaving(false)
  }

  const handleRegenerateCodes = async () => {
    if (!confirm('This will invalidate all existing single-use codes. Continue?')) {
      return
    }

    setRegenerating(true)
    try {
      const result = await api.regenerateCodes(partyId, userId)
      if (result.success) {
        alert('Codes regenerated!')
        await loadParty()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error regenerating codes:', error)
    }
    setRegenerating(false)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!party || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="secondary" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-white">Admin Settings</h1>
        </div>

        {/* Join Codes */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="mb-4">Join Codes</h2>
          
          {/* Everyone Code */}
          <div className="mb-6">
            <Label>Everyone Code (Reusable)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={party.everyoneCode}
                readOnly
                className="text-center text-xl tracking-widest"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyCode(party.everyoneCode)}
              >
                {copiedCode === party.everyoneCode ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
          </div>

          {/* Single-Use Codes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Single-Use Codes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateCodes}
                disabled={regenerating}
              >
                <RefreshCw size={16} className="mr-2" />
                Generate New
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {party.singleUseCodes?.map((suc: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={suc.code}
                    readOnly
                    className={`text-center ${suc.used ? 'bg-muted line-through' : ''}`}
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant={suc.used ? 'secondary' : 'default'}>
                      {suc.used ? 'Used' : 'Available'}
                    </Badge>
                    {!suc.used && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyCode(suc.code)}
                      >
                        {copiedCode === suc.code ? <Check size={18} /> : <Copy size={18} />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="mb-4">Party Password</h2>
          <div>
            <Label>Password (Optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to secure party"
                type="password"
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  try {
                    const result = await api.updatePartyPassword(partyId, userId, password)
                    if (result.success) {
                      alert('Password updated!')
                      await loadParty()
                    } else {
                      alert('Error: ' + result.error)
                    }
                  } catch (error) {
                    console.error('Error updating password:', error)
                  }
                }}
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {password ? 'New members will need this password to join' : 'No password required to join'}
            </p>
          </div>
        </div>

        {/* Admin Management */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="mb-4">Admin Management</h2>
          <div className="space-y-3">
            {members.map((member) => {
              const profile = userProfiles.get(member.userId)
              const isAdmin = party.adminIds.includes(member.userId)
              const isCurrentUser = member.userId === userId
              
              return (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: profile?.profilePicture ? 'transparent' : (profile?.color || '#888') }}
                    >
                      {profile?.profilePicture ? (
                        <img src={profile.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-sm">
                          {profile?.username?.slice(0, 2).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{profile?.username || 'Unknown'}</p>
                      {isCurrentUser && <p className="text-xs text-muted-foreground">You</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <>
                        <Badge variant="default" className="bg-yellow-500">Admin</Badge>
                        {!isCurrentUser && party.adminIds.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Remove admin privileges from this user?')) {
                                try {
                                  const result = await api.removeAdmin(partyId, userId, member.userId)
                                  if (result.success) {
                                    await loadParty()
                                  } else {
                                    alert('Error: ' + result.error)
                                  }
                                } catch (error) {
                                  console.error('Error removing admin:', error)
                                }
                              }
                            }}
                          >
                            Remove Admin
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Promote ${profile?.username} to admin?`)) {
                            try {
                              const result = await api.addAdmin(partyId, userId, member.userId)
                              if (result.success) {
                                await loadParty()
                              } else {
                                alert('Error: ' + result.error)
                              }
                            } catch (error) {
                              console.error('Error adding admin:', error)
                            }
                          }
                        }}
                      >
                        Make Admin
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="mb-4">Party Settings</h2>
          
          <div className="space-y-6">
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

          <Button
            className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}