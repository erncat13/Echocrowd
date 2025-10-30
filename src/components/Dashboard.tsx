import { useState } from 'react'
import { Button } from './ui/button'
import { Plus, LogIn, Users } from 'lucide-react'
import { CreatePartyModal } from './CreatePartyModal'
import { JoinPartyModal } from './JoinPartyModal'

interface DashboardProps {
  userId: string
  username: string
  onPartyJoined: (partyId: string) => void
}

export function Dashboard({ userId, username, onPartyJoined }: DashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">👋 Hey, {username}!</h1>
            <p className="text-muted-foreground">Ready to start talking?</p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={24} className="mr-2" />
              Create Party
            </Button>

            <Button
              className="w-full h-20 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              size="lg"
              onClick={() => setShowJoinModal(true)}
            >
              <LogIn size={24} className="mr-2" />
              Join Party
            </Button>
          </div>

          <div className="mt-8 p-4 bg-purple-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Users className="text-purple-500 mt-1" size={20} />
              <div>
                <h3 className="mb-1">How it works</h3>
                <p className="text-sm text-muted-foreground">
                  Create a party to become the admin, or join an existing party with a code. 
                  Chat with everyone or create teams for private conversations!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreatePartyModal
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onCreated={onPartyJoined}
        />
      )}

      {showJoinModal && (
        <JoinPartyModal
          userId={userId}
          onClose={() => setShowJoinModal(false)}
          onJoined={onPartyJoined}
        />
      )}
    </>
  )
}
