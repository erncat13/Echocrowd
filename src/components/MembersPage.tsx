import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowLeft, Users as UsersIcon, Shield, MessageSquare, Crown } from 'lucide-react'
import { api } from '../utils/api'

interface MembersPageProps {
  userId: string
  partyId: string
  onBack: () => void
}

export function MembersPage({ userId, partyId, onBack }: MembersPageProps) {
  const [party, setParty] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const result = await api.getParty(partyId)
      if (result.success) {
        setParty(result.party)
        setMembers(result.members || [])
        setTeams(result.teams || [])
        
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
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [partyId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading members...</div>
      </div>
    )
  }

  const adminCount = party?.adminIds?.length || 0
  const teamCount = teams.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="secondary" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-white">Party Members</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <UsersIcon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <h2>{members.length}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Teams</p>
                <h2>{teamCount}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <h2>{adminCount}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const profile = userProfiles.get(member.userId)
            const isAdmin = party?.adminIds?.includes(member.userId)
            const memberTeams = teams.filter(t => t.memberIds.includes(member.userId))
            
            return (
              <div key={member.userId} className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: profile?.profilePicture ? 'transparent' : (profile?.color || '#888') }}
                  >
                    {profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white">
                        {profile?.username?.slice(0, 2).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="truncate">{profile?.username || 'Unknown User'}</h4>
                      {isAdmin && <Crown className="text-yellow-500 flex-shrink-0" size={16} />}
                    </div>
                    
                    {isAdmin && (
                      <Badge variant="secondary" className="mb-2">
                        Admin
                      </Badge>
                    )}
                    
                    {memberTeams.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {memberTeams.map((team) => (
                          <Badge
                            key={team.id}
                            className="text-white text-xs"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {members.length === 0 && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center text-white">
            <p>No members yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
