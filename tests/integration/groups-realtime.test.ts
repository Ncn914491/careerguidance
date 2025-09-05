import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

describe('Groups and Real-time Messaging Integration', () => {
  let adminUserId: string
  let testGroupId: string

  beforeAll(async () => {
    // Seed admin user using direct Supabase calls
    const adminEmail = 'nchaitanyanaidu@yahoo.com'
    const adminPassword = 'adminncn@20'

    // Create admin user if not exists
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (authError && !authError.message.includes('already registered')) {
      console.error('Error creating admin user:', authError)
    }

    const userId = authData?.user?.id

    if (userId) {
      // Create or update the profile with admin role
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: adminEmail,
          full_name: 'Chaitanya Naidu',
          role: 'admin'
        })
    }

    // Get admin user ID
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'nchaitanyanaidu@yahoo.com')
      .single()

    adminUserId = adminProfile!.id
  })

  beforeEach(async () => {
    // Create a test group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: 'Test Group',
        description: 'Test group for integration testing',
        created_by: adminUserId
      })
      .select()
      .single()

    expect(error).toBeNull()
    testGroupId = group!.id

    // Add admin as member
    await supabase
      .from('group_members')
      .insert({
        group_id: testGroupId,
        user_id: adminUserId
      })
  })

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('group_messages')
      .delete()
      .like('message', 'Test message%')

    await supabase
      .from('group_members')
      .delete()
      .eq('user_id', adminUserId)

    await supabase
      .from('groups')
      .delete()
      .eq('name', 'Test Group')
  })

  it('should create groups successfully', async () => {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('name', 'Test Group')

    expect(error).toBeNull()
    expect(groups).toHaveLength(1)
    expect(groups![0].name).toBe('Test Group')
    expect(groups![0].description).toBe('Test group for integration testing')
  })

  it('should add users to groups', async () => {
    const { data: members, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', testGroupId)
      .eq('user_id', adminUserId)

    expect(error).toBeNull()
    expect(members).toHaveLength(1)
  })

  it('should send and retrieve messages', async () => {
    // Send a test message
    const testMessage = 'Test message for integration testing'
    const { data: message, error: sendError } = await supabase
      .from('group_messages')
      .insert({
        group_id: testGroupId,
        sender_id: adminUserId,
        message: testMessage
      })
      .select()
      .single()

    expect(sendError).toBeNull()
    expect(message!.message).toBe(testMessage)

    // Retrieve messages
    const { data: messages, error: fetchError } = await supabase
      .from('group_messages')
      .select(`
        *,
        profiles:sender_id (
          full_name,
          email
        )
      `)
      .eq('group_id', testGroupId)
      .order('created_at', { ascending: true })

    expect(fetchError).toBeNull()
    expect(messages).toHaveLength(1)
    expect(messages![0].message).toBe(testMessage)
    expect(messages![0].profiles).toBeTruthy()
  })

  it('should enforce RLS policies for group access', async () => {
    // Create a regular client (non-admin)
    const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Try to access messages without authentication
    const { data: messages, error } = await regularClient
      .from('group_messages')
      .select('*')
      .eq('group_id', testGroupId)

    // Should fail due to RLS
    expect(error).toBeTruthy()
    expect(messages).toBeNull()
  })

  it('should fetch user groups correctly', async () => {
    const { data: userGroups, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', adminUserId)

    expect(error).toBeNull()
    expect(userGroups!.length).toBeGreaterThan(0)
    
    // Should include our test group
    const testGroup = userGroups!.find(g => g.id === testGroupId)
    expect(testGroup).toBeTruthy()
    expect(testGroup!.name).toBe('Test Group')
  })

  it('should handle message ordering correctly', async () => {
    // Send multiple messages
    const messages = [
      'First message',
      'Second message',
      'Third message'
    ]

    for (const msg of messages) {
      await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: adminUserId,
          message: msg
        })
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Retrieve messages in order
    const { data: retrievedMessages, error } = await supabase
      .from('group_messages')
      .select('message, created_at')
      .eq('group_id', testGroupId)
      .order('created_at', { ascending: true })

    expect(error).toBeNull()
    expect(retrievedMessages!.length).toBeGreaterThanOrEqual(3)
    
    // Check that messages are in correct order
    const testMessages = retrievedMessages!.filter(m => messages.includes(m.message))
    expect(testMessages).toHaveLength(3)
    expect(testMessages[0].message).toBe('First message')
    expect(testMessages[1].message).toBe('Second message')
    expect(testMessages[2].message).toBe('Third message')
  })
})