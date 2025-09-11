// Clean up test resource and add proper career resource
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const fixCareerResources = async () => {
  console.log('🔧 Fixing career resources...\n');

  try {
    // Get admin user
    const { data: admin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    // Remove test resource
    console.log('1. Removing test resource...');
    const { error: deleteError } = await supabase
      .from('career_resources')
      .delete()
      .ilike('title', '%Test Career Resource%');
    
    if (deleteError) {
      console.log('⚠️  Could not delete test resource:', deleteError.message);
    } else {
      console.log('✅ Test resource removed');
    }

    // Add a proper career guidance resource
    console.log('2. Adding proper career guidance resource...');
    const careerResource = {
      title: 'Career Planning Guide',
      description: 'Essential guide for students planning their career path after studies',
      resource_type: 'text',
      content_text: `# Career Planning Guide

## Introduction
Planning your career is one of the most important decisions you'll make. This guide provides essential steps to help you navigate your career journey.

## Key Steps:

### 1. Self-Assessment
- Identify your interests, skills, and values
- Take career assessment tests
- Reflect on your strengths and areas for improvement

### 2. Explore Career Options
- Research different industries and roles
- Conduct informational interviews
- Shadow professionals in your field of interest
- Attend career fairs and networking events

### 3. Set Career Goals
- Define short-term goals (1-2 years)
- Set long-term career objectives (5-10 years)
- Create actionable steps to achieve your goals

### 4. Build Your Skills
- Identify skills gaps in your target career
- Take courses or certifications
- Gain relevant experience through internships
- Develop both technical and soft skills

### 5. Create Your Professional Brand
- Build a strong LinkedIn profile
- Create a professional resume
- Develop your elevator pitch
- Build a portfolio of your work

### 6. Network Effectively
- Join professional associations
- Attend industry events
- Connect with alumni
- Maintain professional relationships

### 7. Job Search Strategy
- Use multiple job search channels
- Tailor your applications to each role
- Prepare for interviews
- Follow up appropriately

## Remember
Your career is a journey, not a destination. Stay flexible, keep learning, and be open to opportunities that align with your evolving goals and interests.`,
      display_order: 0,
      is_featured: true,
      created_by: admin.id,
      updated_by: admin.id
    };

    const { data: newResource, error: insertError } = await supabase
      .from('career_resources')
      .insert(careerResource)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Failed to add career resource:', insertError.message);
    } else {
      console.log('✅ Added career guidance resource:', newResource.title);
    }

    // List current resources
    console.log('\n3. Current career resources:');
    const { data: resources } = await supabase
      .from('career_resources')
      .select('title, resource_type, is_featured')
      .order('display_order');

    resources?.forEach((resource, index) => {
      const featured = resource.is_featured ? '⭐' : '';
      console.log(`   ${index + 1}. ${resource.title} (${resource.resource_type}) ${featured}`);
    });

    console.log('\n🎉 Career resources fixed! You can now test the admin panel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

fixCareerResources();
