// Script to add dummy messages to groups for testing the chat UI
// Run with: node scripts/add-dummy-messages.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dummyMessages = [
  "Hey everyone! Welcome to the group! 👋",
  "Thanks for having me here!",
  "What topics are we discussing today?",
  "I'm excited to learn more about career guidance.",
  "Has anyone explored the AI chat feature yet?",
  "Yes! It's really helpful for career advice.",
  "I have a question about resume building.",
  "Sure, what would you like to know?",
  "How do I highlight my skills effectively?",
  "Focus on quantifiable achievements and use action verbs.",
  "That's great advice, thanks!",
  "Don't forget to tailor your resume for each job application.",
  "Good point! Customization is key.",
  "Anyone preparing for interviews?",
  "I have one next week, pretty nervous!",
  "You'll do great! Practice common questions.",
  "Mock interviews really help build confidence.",
  "Thanks for the encouragement everyone! 🙏",
  "We're all in this together!",
  "Let's share more tips and resources.",
  "I found some great articles on LinkedIn.",
  "Please share the links!",
  "Will do! Give me a moment.",
  "This group is so helpful!",
  "Agreed! Great community here.",
];

async function addDummyMessages() {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return;
    }

    if (!groups || groups.length === 0) {
      console.log('No groups found. Please create a group first.');
      return;
    }

    console.log(`Found ${groups.length} groups:`, groups.map(g => g.name).join(', '));

    // Get all users who are members of groups
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, group_id');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    if (!members || members.length === 0) {
      console.log('No group members found. Please join a group first.');
      return;
    }

    // Group members by group_id
    const membersByGroup = {};
    members.forEach(m => {
      if (!membersByGroup[m.group_id]) {
        membersByGroup[m.group_id] = [];
      }
      membersByGroup[m.group_id].push(m.user_id);
    });

    // Add messages to each group
    for (const group of groups) {
      const groupMembers = membersByGroup[group.id];
      
      if (!groupMembers || groupMembers.length === 0) {
        console.log(`No members in group "${group.name}", skipping...`);
        continue;
      }

      console.log(`\nAdding messages to group "${group.name}"...`);

      // Add 10-15 random messages per group
      const messageCount = Math.floor(Math.random() * 6) + 10;
      const messagesToAdd = [];

      for (let i = 0; i < messageCount; i++) {
        const randomMember = groupMembers[Math.floor(Math.random() * groupMembers.length)];
        const randomMessage = dummyMessages[Math.floor(Math.random() * dummyMessages.length)];
        
        // Create timestamps spread over the last few hours
        const hoursAgo = Math.random() * 24;
        const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

        messagesToAdd.push({
          group_id: group.id,
          sender_id: randomMember,
          message: randomMessage,
          created_at: timestamp
        });
      }

      // Sort by timestamp
      messagesToAdd.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const { error: insertError } = await supabase
        .from('group_messages')
        .insert(messagesToAdd);

      if (insertError) {
        console.error(`Error adding messages to "${group.name}":`, insertError);
      } else {
        console.log(`✓ Added ${messageCount} messages to "${group.name}"`);
      }
    }

    console.log('\n✅ Done adding dummy messages!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addDummyMessages();
