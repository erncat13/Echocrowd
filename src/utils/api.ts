import { projectId, publicAnonKey } from './supabase/info'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7996a116`

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  })
  return response.json()
}

export const api = {
  createParty: (userId: string, partyName: string, description: string, banner: string, settings: any, password?: string) =>
    apiCall('/party/create', {
      method: 'POST',
      body: JSON.stringify({ userId, partyName, description, banner, settings, password }),
    }),

  joinParty: (userId: string, code: string, password?: string) =>
    apiCall('/party/join', {
      method: 'POST',
      body: JSON.stringify({ userId, code, password }),
    }),

  getParty: (partyId: string) =>
    apiCall(`/party/${partyId}`),

  updatePartySettings: (partyId: string, userId: string, settings: any) =>
    apiCall(`/party/${partyId}/settings`, {
      method: 'POST',
      body: JSON.stringify({ userId, settings }),
    }),

  updatePartyPassword: (partyId: string, userId: string, password: string) =>
    apiCall(`/party/${partyId}/password`, {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    }),

  regenerateCodes: (partyId: string, userId: string) =>
    apiCall(`/party/${partyId}/codes/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  addAdmin: (partyId: string, userId: string, targetUserId: string) =>
    apiCall(`/party/${partyId}/admin/add`, {
      method: 'POST',
      body: JSON.stringify({ userId, targetUserId }),
    }),

  removeAdmin: (partyId: string, userId: string, targetUserId: string) =>
    apiCall(`/party/${partyId}/admin/remove`, {
      method: 'POST',
      body: JSON.stringify({ userId, targetUserId }),
    }),

  createTeam: (partyId: string, userId: string, teamName: string, description: string, color: string, isPrivate: boolean, maxMembers: number, autoJoin: boolean = true) =>
    apiCall(`/party/${partyId}/team/create`, {
      method: 'POST',
      body: JSON.stringify({ userId, teamName, description, color, isPrivate, maxMembers, autoJoin }),
    }),

  joinTeam: (partyId: string, teamId: string, userId: string) =>
    apiCall(`/party/${partyId}/team/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  sendMessage: (partyId: string, userId: string, chatId: string, content: string, imageUrl?: string) =>
    apiCall(`/party/${partyId}/message`, {
      method: 'POST',
      body: JSON.stringify({ userId, chatId, content, imageUrl }),
    }),

  getMessages: (partyId: string, chatId: string) =>
    apiCall(`/party/${partyId}/messages/${chatId}`),

  uploadImage: async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: formData,
    })
    return response.json()
  },

  getUser: (userId: string) =>
    apiCall(`/user/${userId}`),

  saveUser: (userId: string, username: string, color: string, profilePicture: string) =>
    apiCall(`/user/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ username, color, profilePicture }),
    }),
}