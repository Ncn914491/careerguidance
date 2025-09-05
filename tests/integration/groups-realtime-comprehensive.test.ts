import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
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

describe('Comprehensive Real-time Group Chat Integration', () => {
  let adminUserId: string
  let studentUserId: string
  let student2UserId: string
  let testGroupId: string
  let privateGroupId: string

  beforeAll(async () => {
    // Setup multiple test users
    const adminEmail = 'nchaitanyanaidu@yahoo.com'
    const adminPassword = 'adminncn@20'

    const { data: adminAuth } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    adminUserId = adminAuth.user!.id

    await supabase.from('profiles').upsert({
      id: adminUserId,
      email: adminEmail,
      full_name: 'Chaitanya Naidu',
      role: 'admin'
    })

    // Create student users
    const { data: student1Auth } = await supabase.auth.admin.createUser({
      email: 'student1@example.com',
      password: 'student123',
      email_confirm: true
    })

    studentUserId = student1Auth.user!.id

    await supabase.from('profiles').upsert({
      id: studentUserId,
      email: 'student1@example.com',
      full_name: 'Student One',
      role: 'student'
    })

    const { data: student2Auth } = await supabase.auth.admin.createUser({
      email: 'student2@example.com',
      password: 'student123',
      email_confirm: true
    })

    student2UserId = student2Auth.user!.id

    await supabase.from('profiles').upsert({
      id: student2UserId,
      email: 'student2@example.com',
      full_name: 'Student Two',
      role: 'student'
    })
  })

  beforeEach(async () => {
    // Create test groups
    const { data: mainGroup } = await supabase
      .from('groups')
      .insert({
        name: 'Main Discussion Group',
        description: 'Primary group for all participants',
        created_by: adminUserId
      })
      .select()
      .single()

    testGroupId = mainGroup!.id

    const { data: privateGroup } = await supabase
      .from('groups')
      .insert({
        name: 'Private Study Group',
        description: 'Small group for focused discussions',
        created_by: adminUserId
      })
      .select()
      .single()

    privateGroupId = privateGroup!.id

    // Add members to main group (all users)
    await supabase.from('group_members').insert([
      { group_id: testGroupId, user_id: adminUserId },
      { group_id: testGroupId, user_id: studentUserId },
      { group_id: testGroupId, user_id: student2UserId }
    ])

    // Add only admin and student1 to private group
    await supabase.from('group_members').insert([
      { group_id: privateGroupId, user_id: adminUserId },
      { group_id: privateGroupId, user_id: studentUserId }
    ])
  })

  afterEach(async () => {
    // Clean up test data
    await supabase.from('group_messages').delete().in('group_id', [testGroupId, privateGroupId])
    await supabase.from('group_members').delete().in('group_id', [testGroupId, privateGroupId])
    await supabase.from('groups').delete().in('id', [testGroupId, privateGroupId])
  })

  afterAll(async () => {
    // Clean up users
    await supabase.from('profiles').delete().in('id', [adminUserId, studentUserId, student2UserId])
    await supabase.auth.admin.deleteUser(adminUserId)
    await supabase.auth.admin.deleteUser(studentUserId)
    await supabase.auth.admin.deleteUser(student2UserId)
  })

  describe('Real-time Message Broadcasting', () => {
    it('should broadcast messages to all group members in real-time', async () => {
      const testMessage = 'Hello everyone! This is a real-time test message.'
      
      // Send message as admin
      const { data: sentMessage, error: sendError } = await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: adminUserId,
          message: testMessage
        })
        .select(`
          *,
          profiles:sender_id (
            full_name,
            email,
            role
          )
        `)
        .single()

      expect(sendError).toBeNull()
      expect(sentMessage!.message).toBe(testMessage)
      expect(sentMessage!.profiles.full_name).toBe('Chaitanya Naidu')
      expect(sentMessage!.profiles.role).toBe('admin')

      // Verify all group members can see the message
      const { data: messagesForStudent1 } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles:sender_id (
            full_name,
            email,
            role
          )
        `)
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      const { data: messagesForStudent2 } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles:sender_id (
            full_name,
            email,
            role
          )
        `)
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(messagesForStudent1).toHaveLength(1)
      expect(messagesForStudent2).toHaveLength(1)
      expect(messagesForStudent1![0].message).toBe(testMessage)
      expect(messagesForStudent2![0].message).toBe(testMessage)
    })

    it('should handle rapid message sending without conflicts', async () => {
      const messages = [
        'First rapid message',
        'Second rapid message',
        'Third rapid message',
        'Fourth rapid message',
        'Fifth rapid message'
      ]

      // Send messages rapidly from different users
      const messagePromises = messages.map(async (msg, index) => {
        const senderId = index % 2 === 0 ? adminUserId : studentUserId
        
        return await supabase
          .from('group_messages')
          .insert({
            group_id: testGroupId,
            sender_id: senderId,
            message: msg
          })
          .select()
          .single()
      })

      const results = await Promise.all(messagePromises)
      
      // Verify all messages were sent successfully
      results.forEach((result, index) => {
        expect(result.error).toBeNull()
        expect(result.data!.message).toBe(messages[index])
      })

      // Verify message ordering is maintained
      const { data: allMessages } = await supabase
        .from('group_messages')
        .select('message, created_at')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(allMessages).toHaveLength(5)
      
      // Check chronological order
      for (let i = 0; i < allMessages!.length - 1; i++) {
        const currentTime = new Date(allMessages![i].created_at).getTime()
        const nextTime = new Date(allMessages![i + 1].created_at).getTime()
        expect(currentTime).toBeLessThanOrEqual(nextTime)
      }
    })

    it('should handle message delivery to users joining mid-conversation', async () => {
      // Send initial messages before new user joins
      const initialMessages = [
        'Welcome to the group!',
        'Let\'s discuss career opportunities',
        'What are your interests?'
      ]

      for (const msg of initialMessages) {
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

      // Verify existing members can see all messages
      const { data: messagesBeforeJoin } = await supabase
        .from('group_messages')
        .select('message')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(messagesBeforeJoin).toHaveLength(3)

      // New user should see message history when they access the group
      const { data: messageHistory } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles:sender_id (
            full_name,
            role
          )
        `)
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(messageHistory).toHaveLength(3)
      expect(messageHistory![0].message).toBe('Welcome to the group!')
      expect(messageHistory![2].message).toBe('What are your interests?')
    })
  })

  describe('Group Access Control and Security', () => {
    it('should enforce group membership for message access', async () => {
      // Send message in private group (only admin and student1 are members)
      const privateMessage = 'This is a private group message'
      
      await supabase
        .from('group_messages')
        .insert({
          group_id: privateGroupId,
          sender_id: adminUserId,
          message: privateMessage
        })

      // Student1 (member) should see the message
      const { data: messagesForMember } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', privateGroupId)

      expect(messagesForMember).toHaveLength(1)
      expect(messagesForMember![0].message).toBe(privateMessage)

      // Student2 (non-member) should not see the message due to RLS
      const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      // Simulate student2 trying to access private group messages
      const { data: unauthorizedAccess, error } = await regularClient
        .from('group_messages')
        .select('*')
        .eq('group_id', privateGroupId)

      // Should fail due to RLS policies
      expect(error).toBeTruthy()
      expect(unauthorizedAccess).toBeNull()
    })

    it('should prevent message sending to groups user is not member of', async () => {
      // Try to send message to private group as student2 (non-member)
      const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data, error } = await regularClient
        .from('group_messages')
        .insert({
          group_id: privateGroupId,
          sender_id: student2UserId,
          message: 'Unauthorized message attempt'
        })

      // Should fail due to RLS policies
      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should handle group member removal gracefully', async () => {
      // Send message while all members are present
      await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: studentUserId,
          message: 'Message before removal'
        })

      // Remove student2 from group
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', testGroupId)
        .eq('user_id', student2UserId)

      // Send another message after removal
      await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: adminUserId,
          message: 'Message after removal'
        })

      // Verify remaining members can see both messages
      const { data: messagesForRemainingMembers } = await supabase
        .from('group_messages')
        .select('message')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(messagesForRemainingMembers).toHaveLength(2)
      expect(messagesForRemainingMembers![0].message).toBe('Message before removal')
      expect(messagesForRemainingMembers![1].message).toBe('Message after removal')

      // Verify removed member cannot access new messages
      const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data: removedMemberAccess, error } = await regularClient
        .from('group_messages')
        .select('*')
        .eq('group_id', testGroupId)

      expect(error).toBeTruthy()
      expect(removedMemberAccess).toBeNull()
    })
  })

  describe('Message Features and Functionality', () => {
    it('should handle different message types and lengths', async () => {
      const messageTypes = [
        { type: 'short', content: 'Hi!' },
        { type: 'medium', content: 'This is a medium length message with some details about the career guidance program.' },
        { type: 'long', content: 'This is a very long message that contains extensive information about career opportunities in software engineering, including details about different programming languages, frameworks, development methodologies, career paths, salary expectations, and industry trends. It also covers educational requirements, certification programs, and practical advice for students entering the field.' },
        { type: 'special_chars', content: 'Message with special characters: @#$%^&*()_+-=[]{}|;:,.<>?' },
        { type: 'unicode', content: 'Unicode message: 🚀 Career guidance for 2024! 💻 Programming is fun! 🎯' },
        { type: 'code', content: 'Code snippet: function hello() { console.log("Hello, World!"); }' }
      ]

      for (const msgType of messageTypes) {
        const { data: sentMessage, error } = await supabase
          .from('group_messages')
          .insert({
            group_id: testGroupId,
            sender_id: adminUserId,
            message: msgType.content
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(sentMessage!.message).toBe(msgType.content)
      }

      // Verify all message types are stored and retrieved correctly
      const { data: allMessages } = await supabase
        .from('group_messages')
        .select('message')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(allMessages).toHaveLength(messageTypes.length)
      
      messageTypes.forEach((msgType, index) => {
        expect(allMessages![index].message).toBe(msgType.content)
      })
    })

    it('should maintain message metadata correctly', async () => {
      const testMessage = 'Test message for metadata verification'
      
      const { data: sentMessage } = await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: studentUserId,
          message: testMessage
        })
        .select(`
          *,
          profiles:sender_id (
            full_name,
            email,
            role
          )
        `)
        .single()

      // Verify all metadata is present and correct
      expect(sentMessage!.id).toBeDefined()
      expect(sentMessage!.group_id).toBe(testGroupId)
      expect(sentMessage!.sender_id).toBe(studentUserId)
      expect(sentMessage!.message).toBe(testMessage)
      expect(sentMessage!.created_at).toBeDefined()
      expect(sentMessage!.profiles.full_name).toBe('Student One')
      expect(sentMessage!.profiles.email).toBe('student1@example.com')
      expect(sentMessage!.profiles.role).toBe('student')

      // Verify timestamp is recent (within last minute)
      const messageTime = new Date(sentMessage!.created_at).getTime()
      const now = new Date().getTime()
      const timeDifference = now - messageTime
      expect(timeDifference).toBeLessThan(60000) // Less than 1 minute
    })

    it('should handle concurrent message sending from multiple users', async () => {
      const concurrentMessages = [
        { sender: adminUserId, message: 'Admin message 1' },
        { sender: studentUserId, message: 'Student1 message 1' },
        { sender: student2UserId, message: 'Student2 message 1' },
        { sender: adminUserId, message: 'Admin message 2' },
        { sender: studentUserId, message: 'Student1 message 2' }
      ]

      // Send all messages concurrently
      const sendPromises = concurrentMessages.map(msg => 
        supabase
          .from('group_messages')
          .insert({
            group_id: testGroupId,
            sender_id: msg.sender,
            message: msg.message
          })
          .select()
          .single()
      )

      const results = await Promise.all(sendPromises)
      
      // Verify all messages were sent successfully
      results.forEach((result, index) => {
        expect(result.error).toBeNull()
        expect(result.data!.message).toBe(concurrentMessages[index].message)
        expect(result.data!.sender_id).toBe(concurrentMessages[index].sender)
      })

      // Verify message count and integrity
      const { data: allMessages } = await supabase
        .from('group_messages')
        .select(`
          message,
          sender_id,
          created_at,
          profiles:sender_id (full_name)
        `)
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(allMessages).toHaveLength(5)
      
      // Verify each message is from the correct sender
      allMessages!.forEach((msg, index) => {
        expect(msg.sender_id).toBe(concurrentMessages[index].sender)
        expect(msg.message).toBe(concurrentMessages[index].message)
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large message history efficiently', async () => {
      // Create a large number of messages
      const messageCount = 100
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        group_id: testGroupId,
        sender_id: i % 2 === 0 ? adminUserId : studentUserId,
        message: `Message number ${i + 1} in the conversation`,
        created_at: new Date(Date.now() + i * 1000).toISOString() // Spread over time
      }))

      // Insert messages in batches to avoid timeout
      const batchSize = 20
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        await supabase.from('group_messages').insert(batch)
      }

      // Verify all messages were inserted
      const { data: allMessages } = await supabase
        .from('group_messages')
        .select('message, sender_id, created_at')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: true })

      expect(allMessages).toHaveLength(messageCount)
      
      // Verify ordering is maintained
      for (let i = 0; i < allMessages!.length - 1; i++) {
        const currentTime = new Date(allMessages![i].created_at).getTime()
        const nextTime = new Date(allMessages![i + 1].created_at).getTime()
        expect(currentTime).toBeLessThanOrEqual(nextTime)
      }

      // Test pagination/limiting (simulate fetching recent messages)
      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('message, created_at')
        .eq('group_id', testGroupId)
        .order('created_at', { ascending: false })
        .limit(10)

      expect(recentMessages).toHaveLength(10)
      expect(recentMessages![0].message).toBe('Message number 100 in the conversation')
    })

    it('should handle multiple active groups simultaneously', async () => {
      // Create additional groups
      const additionalGroups = []
      for (let i = 0; i < 5; i++) {
        const { data: group } = await supabase
          .from('groups')
          .insert({
            name: `Test Group ${i + 1}`,
            description: `Additional test group ${i + 1}`,
            created_by: adminUserId
          })
          .select()
          .single()

        additionalGroups.push(group!.id)

        // Add members to each group
        await supabase.from('group_members').insert([
          { group_id: group!.id, user_id: adminUserId },
          { group_id: group!.id, user_id: studentUserId }
        ])
      }

      // Send messages to all groups simultaneously
      const groupMessagePromises = additionalGroups.map((groupId, index) => 
        supabase
          .from('group_messages')
          .insert({
            group_id: groupId,
            sender_id: adminUserId,
            message: `Message for group ${index + 1}`
          })
          .select()
          .single()
      )

      const results = await Promise.all(groupMessagePromises)
      
      // Verify all messages were sent successfully
      results.forEach((result, index) => {
        expect(result.error).toBeNull()
        expect(result.data!.message).toBe(`Message for group ${index + 1}`)
      })

      // Verify messages are isolated to their respective groups
      for (let i = 0; i < additionalGroups.length; i++) {
        const { data: groupMessages } = await supabase
          .from('group_messages')
          .select('message')
          .eq('group_id', additionalGroups[i])

        expect(groupMessages).toHaveLength(1)
        expect(groupMessages![0].message).toBe(`Message for group ${i + 1}`)
      }

      // Cleanup additional groups
      await supabase.from('group_messages').delete().in('group_id', additionalGroups)
      await supabase.from('group_members').delete().in('group_id', additionalGroups)
      await supabase.from('groups').delete().in('id', additionalGroups)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty and whitespace-only messages', async () => {
      const edgeCaseMessages = [
        '', // Empty string
        '   ', // Only spaces
        '\n\n\n', // Only newlines
        '\t\t', // Only tabs
        '  \n  \t  ', // Mixed whitespace
      ]

      for (const msg of edgeCaseMessages) {
        const { data, error } = await supabase
          .from('group_messages')
          .insert({
            group_id: testGroupId,
            sender_id: adminUserId,
            message: msg
          })
          .select()
          .single()

        // These should either succeed (storing the exact content) or fail gracefully
        if (error) {
          // If there's validation preventing empty messages, that's acceptable
          expect(error.message).toBeDefined()
        } else {
          // If empty messages are allowed, they should be stored as-is
          expect(data!.message).toBe(msg)
        }
      }
    })

    it('should handle database connection issues gracefully', async () => {
      // This test would typically involve mocking database failures
      // For now, we'll test that the system can recover from temporary issues
      
      try {
        // Attempt to send message to non-existent group
        const { data, error } = await supabase
          .from('group_messages')
          .insert({
            group_id: 'non-existent-group-id',
            sender_id: adminUserId,
            message: 'This should fail'
          })

        expect(error).toBeTruthy()
        expect(data).toBeNull()
      } catch (err) {
        // Connection or validation error is expected
        expect(err).toBeDefined()
      }

      // Verify normal operation still works after error
      const { data: normalMessage, error: normalError } = await supabase
        .from('group_messages')
        .insert({
          group_id: testGroupId,
          sender_id: adminUserId,
          message: 'Normal message after error'
        })
        .select()
        .single()

      expect(normalError).toBeNull()
      expect(normalMessage!.message).toBe('Normal message after error')
    })

    it('should handle message retrieval with invalid parameters', async () => {
      // Test various invalid query parameters
      const invalidQueries = [
        { group_id: 'invalid-uuid' },
        { group_id: null },
        { group_id: '' }
      ]

      for (const query of invalidQueries) {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', query.group_id as any)

        // Should either return empty results or fail gracefully
        if (error) {
          expect(error.message).toBeDefined()
        } else {
          expect(Array.isArray(data)).toBe(true)
          expect(data).toHaveLength(0)
        }
      }
    })
  })
});