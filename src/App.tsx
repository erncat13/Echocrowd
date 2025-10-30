import { useState, useEffect } from 'react'
import { UsernameSetup } from './components/UsernameSetup'
import { Dashboard } from './components/Dashboard'
import { PartyLobby } from './components/PartyLobby'
import { MembersPage } from './components/MembersPage'
import { AdminSettings } from './components/AdminSettings'
import { TeamChat } from './components/TeamChat'

type Screen = 
  | { type: 'username-setup' }
  | { type: 'dashboard' }
  | { type: 'party-lobby'; partyId: string }
  | { type: 'members'; partyId: string }
  | { type: 'admin'; partyId: string }
  | { type: 'chat'; partyId: string; chatId: string; chatName: string; chatColor: string }

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: 'username-setup' })
  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [avatarColor, setAvatarColor] = useState<string>('')
  const [profilePicture, setProfilePicture] = useState<string>('')

  useEffect(() => {
    // Check if user has already set up their profile
    const storedUserId = localStorage.getItem('userId')
    const storedUsername = localStorage.getItem('username')
    const storedColor = localStorage.getItem('avatarColor')
    const storedPicture = localStorage.getItem('profilePicture')

    if (storedUserId && storedUsername) {
      setUserId(storedUserId)
      setUsername(storedUsername)
      setAvatarColor(storedColor || '#888')
      setProfilePicture(storedPicture || '')
      setCurrentScreen({ type: 'dashboard' })
    }
  }, [])

  const handleUsernameComplete = (uid: string, uname: string, color: string, picture: string) => {
    setUserId(uid)
    setUsername(uname)
    setAvatarColor(color)
    setProfilePicture(picture)
    setCurrentScreen({ type: 'dashboard' })
  }

  const handlePartyJoined = (partyId: string) => {
    setCurrentScreen({ type: 'party-lobby', partyId })
  }

  const handleBackToDashboard = () => {
    setCurrentScreen({ type: 'dashboard' })
  }

  const handleNavigateToMembers = (partyId: string) => {
    setCurrentScreen({ type: 'members', partyId })
  }

  const handleNavigateToAdmin = (partyId: string) => {
    setCurrentScreen({ type: 'admin', partyId })
  }

  const handleNavigateToChat = (partyId: string, chatId: string, chatName: string, chatColor: string) => {
    setCurrentScreen({ type: 'chat', partyId, chatId, chatName, chatColor })
  }

  const handleBackToLobby = (partyId: string) => {
    setCurrentScreen({ type: 'party-lobby', partyId })
  }

  // Render current screen
  switch (currentScreen.type) {
    case 'username-setup':
      return <UsernameSetup onComplete={handleUsernameComplete} />

    case 'dashboard':
      return (
        <Dashboard
          userId={userId}
          username={username}
          onPartyJoined={handlePartyJoined}
        />
      )

    case 'party-lobby':
      return (
        <PartyLobby
          userId={userId}
          partyId={currentScreen.partyId}
          onNavigateToMembers={() => handleNavigateToMembers(currentScreen.partyId)}
          onNavigateToAdmin={() => handleNavigateToAdmin(currentScreen.partyId)}
          onNavigateToChat={(chatId, chatName, chatColor) =>
            handleNavigateToChat(currentScreen.partyId, chatId, chatName, chatColor)
          }
          onBack={handleBackToDashboard}
        />
      )

    case 'members':
      return (
        <MembersPage
          userId={userId}
          partyId={currentScreen.partyId}
          onBack={() => handleBackToLobby(currentScreen.partyId)}
        />
      )

    case 'admin':
      return (
        <AdminSettings
          userId={userId}
          partyId={currentScreen.partyId}
          onBack={() => handleBackToLobby(currentScreen.partyId)}
        />
      )

    case 'chat':
      return (
        <TeamChat
          userId={userId}
          partyId={currentScreen.partyId}
          chatId={currentScreen.chatId}
          chatName={currentScreen.chatName}
          chatColor={currentScreen.chatColor}
          onBack={() => handleBackToLobby(currentScreen.partyId)}
        />
      )

    default:
      return <UsernameSetup onComplete={handleUsernameComplete} />
  }
}
