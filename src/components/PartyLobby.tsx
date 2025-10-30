import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Users, Settings, Plus, ArrowLeft, MessageSquare, Lock, Crown } from 'lucide-react'
import { api } from '../utils/api'
import { CreateTeamModal } from './CreateTeamModal'

interface PartyLobbyProps {
  userId: string
  partyId: string
  onNavigateToMembers: () => void
  onNavigateToAdmin: () => void
  onNavigateToChat: (chatId: string, chatName: string, chatColor: string) => void
  onBack: () => void
}

export function PartyLobby({ userId, partyId, onNavigateToMembers, onNavigateToAdmin, onNavigateToChat, onBack }: PartyLobbyProps) {
  const [party, setParty] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<string[]>([])
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [loading, setLoading] = useState(true)

  const isAdmin = party?.adminIds?.includes(userId)

  const loadParty = async () => {
    try {
      const result = await api.getParty(partyId)
      if (result.success) {
        setParty(result.party)
        setTeams(result.teams || [])
        setMembers(result.members || [])
        
        const member = result.members?.find((m: any) => m.userId === userId)
        setUserTeams(member?.teamIds || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading party:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParty()
    const interval = setInterval(loadParty, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [partyId])

  const handleJoinTeam = async (teamId: string) => {
    try {
      const result = await api.joinTeam(partyId, teamId, userId)
      if (result.success) {
        await loadParty()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error joining team:', error)
    }
  }

  const canCreateTeam = () => {
    if (!party) return false
    if (isAdmin) return true
    if (!party.settings.membersCanCreateTeams) return false
    if (!party.settings.allowMultipleTeams && userTeams.length > 0) return false
    if (party.settings.maxTeamsPerUser > 0 && userTeams.length >= party.settings.maxTeamsPerUser) return false
    return true
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading party...</div>
      </div>
    )
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Party not found</div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-4">
            {party.banner ? (
              <img src={party.banner} alt="Party Banner" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-6xl">🎉</span>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h1>{party.name}</h1>
                  {isAdmin && <Crown className="text-yellow-500" size={24} />}
                </div>
              </div>
              {party.description && (
                <p className="text-muted-foreground mb-4">{party.description}</p>
              )}
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={onNavigateToMembers} variant="outline">
                  <Users size={18} className="mr-2" />
                  Members ({members.length})
                </Button>
                {isAdmin && (
                  <Button onClick={onNavigateToAdmin} variant="outline">
                    <Settings size={18} className="mr-2" />
                    Admin
                  </Button>
                )}
                {canCreateTeam() && (
                  <Button onClick={() => setShowCreateTeam(true)} className="bg-purple-500 hover:bg-purple-600">
                    <Plus size={18} className="mr-2" />
                    Create Team
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Everyone Chat */}
          <div
            className="bg-white rounded-2xl shadow-xl p-6 mb-4 cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={() => onNavigateToChat('everyone', 'Everyone Chat', '#10b981')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div>
                  <h3>Everyone Chat</h3>
                  <p className="text-sm text-muted-foreground">Public chat for all members</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">PUBLIC</Badge>
                <Badge variant="secondary">{members.length} members</Badge>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-4">
            <h2 className="text-white">Teams</h2>
            
            {teams.length === 0 ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center text-white">
                <p>No teams yet. Create the first one!</p>
              </div>
            ) : (
              teams.map((team) => {
                const isJoined = userTeams.includes(team.id)
                const isFull = team.maxMembers > 0 && team.memberIds.length >= team.maxMembers
                
                return (
                  <div
                    key={team.id}
                    className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => {
                      if (isJoined) {
                        onNavigateToChat(team.id, team.name, team.color)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.isPrivate && <Lock className="text-white" size={20} />}
                          {!team.isPrivate && <MessageSquare className="text-white" size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3>{team.name}</h3>
                            {team.isPrivate && <Lock size={16} className="text-muted-foreground" />}
                          </div>
                          {team.description && (
                            <p className="text-sm text-muted-foreground">{team.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isJoined && (
                          <Badge className="bg-purple-500">JOINED</Badge>
                        )}
                        <Badge variant="secondary">
                          {team.memberIds.length}
                          {team.maxMembers > 0 && `/${team.maxMembers}`}
                        </Badge>
                        {!isJoined && !team.isPrivate && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleJoinTeam(team.id)
                            }}
                            disabled={isFull}
                            style={{ backgroundColor: team.color }}
                          >
                            {isFull ? 'Full' : 'Join'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {showCreateTeam && (
        <CreateTeamModal
          userId={userId}
          partyId={partyId}
          isAdmin={isAdmin}
          onClose={() => setShowCreateTeam(false)}
          onCreated={loadParty}
        />
      )}
    </>
  )
}