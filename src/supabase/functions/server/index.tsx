import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Generate random codes
function generateCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate unique code
async function generateUniqueCode(): Promise<string> {
  let code = generateCode(6)
  let existing = await kv.get(`code:${code}`)
  while (existing) {
    code = generateCode(6)
    existing = await kv.get(`code:${code}`)
  }
  return code
}

// Create party
app.post('/make-server-7996a116/party/create', async (c) => {
  try {
    const body = await c.req.json()
    const { userId, partyName, description, banner, settings, password } = body

    const partyId = crypto.randomUUID()
    const everyoneCode = await generateUniqueCode()
    const singleUseCodes = []
    
    for (let i = 0; i < 5; i++) {
      singleUseCodes.push({
        code: await generateUniqueCode(),
        used: false
      })
    }

    const party = {
      id: partyId,
      name: partyName,
      description,
      banner,
      adminIds: [userId],
      everyoneCode,
      singleUseCodes,
      password: password || null,
      settings: {
        membersCanSeeJoinCodes: false,
        allowMultipleTeams: true,
        maxTeamsPerUser: 3,
        membersCanCreateTeams: true,
        maxMembers: 0,
        voiceChatEnabled: true,
        imageShareEnabled: true,
        ...settings
      },
      createdAt: new Date().toISOString()
    }

    await kv.set(`party:${partyId}`, party)
    await kv.set(`code:${everyoneCode}`, { partyId, type: 'everyone' })
    
    for (const suc of singleUseCodes) {
      await kv.set(`code:${suc.code}`, { partyId, type: 'single', used: false })
    }

    // Add creator as member
    await kv.set(`party:${partyId}:members`, [{
      userId,
      joinedAt: new Date().toISOString(),
      teamIds: []
    }])

    // Create everyone chat
    await kv.set(`party:${partyId}:messages:everyone`, [])
    
    // Initialize teams array
    await kv.set(`party:${partyId}:teams`, [])

    return c.json({ success: true, party, partyId })
  } catch (error) {
    console.log('Error creating party:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Join party
app.post('/make-server-7996a116/party/join', async (c) => {
  try {
    const body = await c.req.json()
    const { userId, code, password } = body

    const codeData = await kv.get(`code:${code}`)
    if (!codeData) {
      return c.json({ success: false, error: 'Invalid code' }, 400)
    }

    const { partyId, type, used } = codeData

    if (type === 'single' && used) {
      return c.json({ success: false, error: 'Code already used' }, 400)
    }

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    // Check password if party has one
    if (party.password && party.password !== password) {
      return c.json({ success: false, error: 'Incorrect password', requiresPassword: true }, 401)
    }

    const members = await kv.get(`party:${partyId}:members`) || []
    
    // Check if already a member
    if (members.some((m: any) => m.userId === userId)) {
      return c.json({ success: true, party, partyId, alreadyMember: true })
    }

    // Check max members
    if (party.settings.maxMembers > 0 && members.length >= party.settings.maxMembers) {
      return c.json({ success: false, error: 'Party is full' }, 400)
    }

    // Add member
    members.push({
      userId,
      joinedAt: new Date().toISOString(),
      teamIds: []
    })
    await kv.set(`party:${partyId}:members`, members)

    // Mark single-use code as used
    if (type === 'single') {
      await kv.set(`code:${code}`, { ...codeData, used: true })
      
      // Update party's singleUseCodes array
      const updatedCodes = party.singleUseCodes.map((suc: any) =>
        suc.code === code ? { ...suc, used: true } : suc
      )
      party.singleUseCodes = updatedCodes
      await kv.set(`party:${partyId}`, party)
    }

    return c.json({ success: true, party, partyId, requiresPassword: !!party.password })
  } catch (error) {
    console.log('Error joining party:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get party
app.get('/make-server-7996a116/party/:partyId', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const party = await kv.get(`party:${partyId}`)
    
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    const members = await kv.get(`party:${partyId}:members`) || []
    const teams = await kv.get(`party:${partyId}:teams`) || []

    return c.json({ success: true, party, members, teams })
  } catch (error) {
    console.log('Error getting party:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Update party settings
app.post('/make-server-7996a116/party/:partyId/settings', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, settings } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    if (!party.adminIds.includes(userId)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    party.settings = { ...party.settings, ...settings }
    await kv.set(`party:${partyId}`, party)

    return c.json({ success: true, party })
  } catch (error) {
    console.log('Error updating party settings:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Generate new single-use codes
app.post('/make-server-7996a116/party/:partyId/codes/regenerate', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    if (!party.adminIds.includes(userId)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    // Delete old codes
    for (const suc of party.singleUseCodes) {
      await kv.del(`code:${suc.code}`)
    }

    // Generate new codes
    const singleUseCodes = []
    for (let i = 0; i < 5; i++) {
      const code = await generateUniqueCode()
      singleUseCodes.push({ code, used: false })
      await kv.set(`code:${code}`, { partyId, type: 'single', used: false })
    }

    party.singleUseCodes = singleUseCodes
    await kv.set(`party:${partyId}`, party)

    return c.json({ success: true, party })
  } catch (error) {
    console.log('Error regenerating codes:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Create team
app.post('/make-server-7996a116/party/:partyId/team/create', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, teamName, description, color, isPrivate, maxMembers, autoJoin } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    const members = await kv.get(`party:${partyId}:members`) || []
    const member = members.find((m: any) => m.userId === userId)
    
    if (!member) {
      return c.json({ success: false, error: 'Not a party member' }, 403)
    }

    const isAdmin = party.adminIds.includes(userId)
    if (!party.settings.membersCanCreateTeams && !isAdmin) {
      return c.json({ success: false, error: 'Not authorized to create teams' }, 403)
    }

    const teams = await kv.get(`party:${partyId}:teams`) || []
    const teamId = crypto.randomUUID()
    
    // Admins can create teams without joining (autoJoin defaults to true)
    const shouldAutoJoin = autoJoin !== false
    
    const team = {
      id: teamId,
      name: teamName,
      description,
      color,
      isPrivate,
      maxMembers: maxMembers || 0,
      creatorId: userId,
      memberIds: shouldAutoJoin ? [userId] : [],
      createdAt: new Date().toISOString()
    }

    teams.push(team)
    await kv.set(`party:${partyId}:teams`, teams)

    // Add team to user's teamIds only if auto-joining
    if (shouldAutoJoin) {
      member.teamIds.push(teamId)
      await kv.set(`party:${partyId}:members`, members)
    }

    // Create team chat
    await kv.set(`party:${partyId}:messages:${teamId}`, [])

    return c.json({ success: true, team })
  } catch (error) {
    console.log('Error creating team:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Join team
app.post('/make-server-7996a116/party/:partyId/team/:teamId/join', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const teamId = c.req.param('teamId')
    const body = await c.req.json()
    const { userId } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    const members = await kv.get(`party:${partyId}:members`) || []
    const member = members.find((m: any) => m.userId === userId)
    
    if (!member) {
      return c.json({ success: false, error: 'Not a party member' }, 403)
    }

    const teams = await kv.get(`party:${partyId}:teams`) || []
    const team = teams.find((t: any) => t.id === teamId)
    
    if (!team) {
      return c.json({ success: false, error: 'Team not found' }, 404)
    }

    if (team.isPrivate) {
      return c.json({ success: false, error: 'Team is private' }, 403)
    }

    if (team.maxMembers > 0 && team.memberIds.length >= team.maxMembers) {
      return c.json({ success: false, error: 'Team is full' }, 400)
    }

    if (team.memberIds.includes(userId)) {
      return c.json({ success: true, alreadyMember: true })
    }

    // Check if user can join multiple teams
    if (!party.settings.allowMultipleTeams && member.teamIds.length > 0) {
      return c.json({ success: false, error: 'Already in a team' }, 400)
    }

    if (party.settings.maxTeamsPerUser > 0 && member.teamIds.length >= party.settings.maxTeamsPerUser) {
      return c.json({ success: false, error: 'Maximum teams reached' }, 400)
    }

    // Add user to team
    team.memberIds.push(userId)
    await kv.set(`party:${partyId}:teams`, teams)

    // Add team to user
    member.teamIds.push(teamId)
    await kv.set(`party:${partyId}:members`, members)

    return c.json({ success: true })
  } catch (error) {
    console.log('Error joining team:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Send message
app.post('/make-server-7996a116/party/:partyId/message', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, chatId, content, imageUrl } = body

    const members = await kv.get(`party:${partyId}:members`) || []
    const member = members.find((m: any) => m.userId === userId)
    
    if (!member) {
      return c.json({ success: false, error: 'Not a party member' }, 403)
    }

    // Verify team membership if not everyone chat
    if (chatId !== 'everyone') {
      const teams = await kv.get(`party:${partyId}:teams`) || []
      const team = teams.find((t: any) => t.id === chatId)
      if (!team || !team.memberIds.includes(userId)) {
        return c.json({ success: false, error: 'Not a team member' }, 403)
      }
    }

    const messages = await kv.get(`party:${partyId}:messages:${chatId}`) || []
    const message = {
      id: crypto.randomUUID(),
      userId,
      content,
      imageUrl,
      timestamp: new Date().toISOString()
    }

    messages.push(message)
    await kv.set(`party:${partyId}:messages:${chatId}`, messages)

    return c.json({ success: true, message })
  } catch (error) {
    console.log('Error sending message:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get messages
app.get('/make-server-7996a116/party/:partyId/messages/:chatId', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const chatId = c.req.param('chatId')
    
    const messages = await kv.get(`party:${partyId}:messages:${chatId}`) || []
    
    return c.json({ success: true, messages })
  } catch (error) {
    console.log('Error getting messages:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Upload image
app.post('/make-server-7996a116/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400)
    }

    const bucketName = 'make-7996a116-walkytalky'
    
    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false })
    }

    const fileName = `${folder}/${crypto.randomUUID()}-${file.name}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.log('Upload error:', uploadError)
      return c.json({ success: false, error: uploadError.message }, 500)
    }

    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    return c.json({ success: true, url: signedUrlData?.signedUrl })
  } catch (error) {
    console.log('Error uploading image:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get user profile
app.get('/make-server-7996a116/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const user = await kv.get(`user:${userId}`)
    
    return c.json({ success: true, user })
  } catch (error) {
    console.log('Error getting user:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Save user profile
app.post('/make-server-7996a116/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { username, color, profilePicture } = body

    await kv.set(`user:${userId}`, {
      userId,
      username,
      color,
      profilePicture,
      updatedAt: new Date().toISOString()
    })

    return c.json({ success: true })
  } catch (error) {
    console.log('Error saving user:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Add/promote admin
app.post('/make-server-7996a116/party/:partyId/admin/add', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, targetUserId } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    if (!party.adminIds.includes(userId)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    if (party.adminIds.includes(targetUserId)) {
      return c.json({ success: false, error: 'User is already an admin' }, 400)
    }

    const members = await kv.get(`party:${partyId}:members`) || []
    if (!members.some((m: any) => m.userId === targetUserId)) {
      return c.json({ success: false, error: 'User is not a party member' }, 400)
    }

    party.adminIds.push(targetUserId)
    await kv.set(`party:${partyId}`, party)

    return c.json({ success: true, party })
  } catch (error) {
    console.log('Error adding admin:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Remove admin
app.post('/make-server-7996a116/party/:partyId/admin/remove', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, targetUserId } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    if (!party.adminIds.includes(userId)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    if (!party.adminIds.includes(targetUserId)) {
      return c.json({ success: false, error: 'User is not an admin' }, 400)
    }

    if (party.adminIds.length === 1) {
      return c.json({ success: false, error: 'Cannot remove the last admin' }, 400)
    }

    party.adminIds = party.adminIds.filter((id: string) => id !== targetUserId)
    await kv.set(`party:${partyId}`, party)

    return c.json({ success: true, party })
  } catch (error) {
    console.log('Error removing admin:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Update party password
app.post('/make-server-7996a116/party/:partyId/password', async (c) => {
  try {
    const partyId = c.req.param('partyId')
    const body = await c.req.json()
    const { userId, password } = body

    const party = await kv.get(`party:${partyId}`)
    if (!party) {
      return c.json({ success: false, error: 'Party not found' }, 404)
    }

    if (!party.adminIds.includes(userId)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    party.password = password || null
    await kv.set(`party:${partyId}`, party)

    return c.json({ success: true, party })
  } catch (error) {
    console.log('Error updating password:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)