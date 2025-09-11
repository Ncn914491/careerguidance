#!/usr/bin/env node

/**
 * Database Seeding Script - Update Weeks with Real Career Guidance Program Data
 * 
 * This script updates the database with real weeks content from the 5-week career guidance program
 * Usage: node scripts/seed-weeks-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Real weeks data from the 5-week career guidance program
const weeksData = [
  {
    week_number: 1,
    title: 'Laying the Foundation: Aspiration and Exploration',
    description: `We are pleased to present the summary of our first week's Community Service Project report. This report details the activities and outcomes of a Career Guidance Program conducted from July 11th to July 13th, 2025, for students at the Gaigolupadu Government School and the Ananda Nilayam Boys Hostel. The primary objective of this initiative was to raise awareness among students about the significance of higher education and the benefits of early career planning.

Day 1: Foundation and Aspiration Mapping
Location: Gaigolupadu Government School.
Audience: Students of the 8th and 9th classes.
Session Focus: The initial session aimed to interact with students, understand their aspirations, and explain the importance of making informed decisions after 10th grade.
Activities: Using a digital television and a PowerPoint presentation, we displayed career roadmap diagrams to illustrate pathways available after Class 10. Students shared their future goals, which included becoming a doctor, IAS officer, police officer, agriculture scientist, government teacher, and master chef. We provided guidance on the educational paths for these professions.

Day 2: Focus on Public Service and Defence
Location: Ananda Nilayam Boys Hostel.
Audience: Approximately 40 students.
Session Focus: This session was tailored to discuss careers in public service and the defence sector, as a majority of students showed interest in these fields.
Activities: We provided an overview of the responsibilities and societal impact of careers in the police force and the Indian Administrative Service (IAS). We detailed the educational requirements, recruitment exams, and the importance of physical fitness and discipline for these roles. Students asked questions about academic eligibility and handling exam failures, which were addressed in detail.

Day 3: Exploring Diverse Career Streams and Conclusion
Location: Ananda Nilayam Boys Hostel.
Audience: Approximately 40 students.
Session Focus: The final day was designed to give students a comprehensive understanding of a wide range of career options.
Activities: We discussed career prospects in Science, Arts & Humanities, Commerce, and Law, as well as vocational courses. The session also highlighted the value of entrepreneurship, extracurricular activities, and the impact of technology like AI and robotics on all career fields. To keep the session engaging, we conducted a quiz and distributed chocolates to active participants.

The week concluded successfully, fostering an environment of motivation and informed decision-making. Students showed great enthusiasm and left with increased confidence and clarity regarding their future educational and professional goals.`
  },
  {
    week_number: 2,
    title: 'Charting the Course: A Detailed Look at Major Career Fields',
    description: `We are pleased to present the summary of our second week's Community Service Project report, which details the Career Guidance Program conducted on July 17th and 18th, 2025, at Gaigolupadu Government School. The objective for this week was to provide 40 students with in-depth awareness about specific career paths, including their eligibility and suitability based on individual interests.

Day 1 (July 17th): Engineering and Medical Careers
The first session focused on two major professional fields:

Engineering: We explained that engineering involves applying science and mathematics to solve real-world problems. The educational pathway typically involves the MPC stream in Intermediate followed by entrance exams like JEE or EAMCET. We detailed various branches such as Computer Science, Civil, Mechanical, and Electrical Engineering. This path is best suited for students who enjoy problem-solving, mathematics, and physics.

Medical and Health Sciences: This was presented as a respected profession focused on diagnosing, treating, and preventing diseases. To pursue medicine, students should opt for the BiPC stream in Intermediate and clear the NEET exam. We discussed various career options including MBBS to become a doctor, BDS for dentistry, and other fields like nursing and physiotherapy. This field is ideal for students with a strong interest in biology, a desire to help others, and qualities like patience and empathy.

Day 2 (July 18th): Diverse Career Paths and Final Review
The second session expanded the discussion to cover a wider range of professions:

Government Sector: We highlighted these jobs for their stability and social impact. Entry is through competitive exams for roles in banking (SSC, RRB), law enforcement, civil services (UPSC), and defence (NDA, CDS).

Law: This career allows individuals to uphold justice and defend rights. Pathways include a 5-year integrated degree after the 12th or a 3-year LLB after graduation. It is well-suited for students who excel at debating, critical thinking, and public speaking.

Sports: We presented sports as a respected profession with growing opportunities. Careers can be pursued as professional athletes, coaches, or physical education teachers.

Entrepreneurship: This path involves starting and managing one's own business. We introduced concepts like small-scale businesses and digital entrepreneurship, emphasizing that self-motivation and persistence are key.

Student Feedback and Conclusion
The week concluded with a doubt-clearing session where students asked about pursuing non-academic and business-oriented careers. Student reflections were overwhelmingly positive, with many expressing surprise at the variety of career options available beyond traditional choices like "doctor or police". The sessions helped students connect their dreams to concrete steps and left them with greater clarity and the encouragement to believe in their potential.`
  },
  {
    week_number: 3,
    title: 'Inspiring Young Minds Through Creative Engagement',
    description: `We are pleased to present the summary of our third week's Community Service Project, which extended the Career Guidance Program to Sanjeev Synergy School on July 24th and 25th, 2025. The sessions engaged students from Classes 6 to 8. As the school lacked digital resources like smart boards, we adapted our approach to be more storytelling and activity-based to suit the younger audience. The objective was to encourage early career curiosity and inspire students through interactive methods like drawing, discussion, and role-play.

Day 1 (July 24th): Inspiring Dreams Through Stories and Art
Focus: The session began by asking students imaginative questions about what they want to be when they grow up. Responses included common goals like doctor and police officer, as well as creative ideas like YouTuber and fashion designer.
Activities: The concept of a "career" was simplified as "what you want to be when you grow up and how you help others". A key activity was "Career Drawings," where students were given paper and colors to draw their dream jobs.
Motivation: To keep students engaged, we used motivational stories inspired by figures like Dr. A.P.J. Abdul Kalam and other real-life examples of individuals who achieved success from humble beginnings.

Day 2 (July 25th): Connecting Education to Careers
Focus: The second day's session aimed to show students the path from school to their future careers, using charts and physical gestures for visualization.
Topics Covered: We explained how different school subjects are important for various professions; for example, Math for engineers, Science for doctors, and English for writers. We also discussed role models like M.S. Dhoni and Kalpana Chawla and emphasized the importance of respecting all careers.
Interaction: An open Q&A session allowed students to ask practical questions, such as "Can I become a police officer if I wear glasses?" and "What is the first step to become a scientist?".

Student Reflections and Overall Conclusion
The students were highly engaged, particularly enjoying the interactive storytelling and drawing activities. Reflections showed that the sessions had a significant impact; one 8th-grade student remarked, "I didn't know girls can become pilots. Now I want to fly a plane". Despite the lack of digital tools, the program was highly effective. The experience validated our belief that career awareness should begin at an early age, and the sessions successfully empowered students to "dream without fear and plan without limits".`
  },
  {
    week_number: 4,
    title: 'Bridging the Gap: From Traditional Paths to Emerging Opportunities',
    description: `We are pleased to present the summary of our fourth week's Community Service Project report. This report covers a two-day career guidance session conducted on August 1st and 2nd, 2025, for 40 Class 9 students at the Municipal Corporation High School, Kondayya Palem, Kakinada. The primary objective of this program was to bridge the gap between student curiosity and career awareness by introducing them to various pathways available after the 10th class.

Day 1 (August 1st): Exploring Traditional Career Paths
Focus: The first day's session concentrated on conventional career streams after the 10th class.
Topics Covered: Using a smartboard presentation, our team discussed Intermediate paths like MPC and BIPC, the Polytechnic stream, and major fields in Engineering and Medicine. We also explained entrance exams such as EAMCET and NEET.
Student Interaction: Students actively participated, asking questions like, "Can I become an engineer without studying MPC?" and "How many marks do we need for polytechnic?".

Day 2 (August 2nd): Introducing Alternative and Emerging Careers
Focus: The second day expanded the discussion beyond traditional options to include alternative and emerging career fields.
Topics Covered: We introduced students to opportunities in the Government Sector (SSC, Police, UPSC), vocational and technical trades (Electrician, Tailoring, ITI courses), Entrepreneurship (starting a business or freelancing), and careers in Sports and Law.
Student Interaction: The session prompted thoughtful questions from students, such as, "Can I get a job without becoming an engineer or doctor?" and "Can girls become pilots or police officers?".

Student Feedback and Conclusion
The program was very well-received by the students. Feedback indicated that they gained significant knowledge about the different career options available to them. One student mentioned, "I want to become a teacher and now I know which stream I need to take". The visit was impactful, highlighting the necessity of early career exposure, especially in government schools. The sessions successfully empowered students with the insights needed to make informed choices about their futures.`
  },
  {
    week_number: 5,
    title: 'Planning for the Future: Comprehensive Guidance and Practical Advice',
    description: `We are pleased to present the summary of our fifth week's Community Service Project report. This report covers a career guidance session conducted on August 21st, 2025, for 40 Class 9 students at the Municipal Corporation High School in Kondayya Palem, Kakinada. The program's objective was to bridge the gap between student curiosity and career awareness by providing clear guidance on the various pathways available after Class 10.

Session Activities and Topics Covered
The session began with an interactive introduction where students shared their career aspirations, including ambitions to become doctors, engineers, teachers, and entrepreneurs. Our team then delivered a structured presentation covering several key areas:

Intermediate Streams: We explained the MPC, BiPC, MEC, and CEC streams and emphasized choosing subjects based on interest and aptitude rather than peer pressure.

Professional Pathways: Detailed guidance was provided on Engineering (via JEE, EAMCET), Medicine (via NEET), and careers in Commerce and Arts (such as CA, Law, and Journalism).

Alternative Careers: We also introduced vocational and alternative paths, including Polytechnic, ITI, Sports, Defense Services, and Entrepreneurship.

Practical Advice: The session included practical tips on early exam preparation, time management, and using free online resources and government scholarships for higher studies.

Student Interaction and Conclusion
The Q&A session was highly interactive, with students asking insightful questions about girls joining the defense services, academic requirements for becoming a pilot, and the availability of government schemes for students from low-income backgrounds.

Student feedback was very positive. One student, M. Lakshmi, noted, "Now I know that there are many jobs apart from engineering and medicine," while another, B. Ramesh, was inspired to "try for the defense services after this session".

The program was impactful and educational, successfully clearing misconceptions about career streams and exposing students to emerging opportunities. It motivated the students to think about their futures early and plan with confidence and clarity.`
  }
];

async function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${type}] ${timestamp}: ${message}${colors.RESET}`);
}

async function clearExistingWeeks() {
  log('Clearing existing weeks data...');
  
  // First clear week files
  const { error: filesError } = await supabase
    .from('week_files')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (filesError) {
    log(`Warning clearing week files: ${filesError.message}`, 'WARNING');
  }
  
  // Clear existing weeks
  const { error: weeksError } = await supabase
    .from('weeks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (weeksError) {
    log(`Error clearing weeks: ${weeksError.message}`, 'ERROR');
    throw weeksError;
  }
  
  log('✓ Existing weeks data cleared', 'SUCCESS');
}

async function seedWeeks() {
  log('Seeding weeks with real career guidance program data...');
  
  const { data, error } = await supabase
    .from('weeks')
    .insert(weeksData)
    .select();
  
  if (error) {
    log(`Error seeding weeks: ${error.message}`, 'ERROR');
    throw error;
  }
  
  log(`✓ Successfully seeded ${data.length} weeks`, 'SUCCESS');
  data.forEach(week => {
    log(`  - Week ${week.week_number}: ${week.title}`, 'INFO');
  });
  
  return data;
}

async function verifyWeeksData() {
  log('Verifying seeded weeks data...');
  
  const { data: weeksData, error } = await supabase
    .from('weeks')
    .select('*')
    .order('week_number');
  
  if (error) {
    log(`Error verifying weeks: ${error.message}`, 'ERROR');
    throw error;
  }
  
  log(`✓ Verification complete:`, 'SUCCESS');
  log(`  - Total Weeks: ${weeksData.length}`, 'INFO');
  
  return weeksData;
}

async function main() {
  try {
    log('🚀 Starting weeks database seeding with real career guidance program data...');
    
    // Check if Supabase credentials are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials. Please check your .env.local file.');
    }
    
    await clearExistingWeeks();
    const seededWeeks = await seedWeeks();
    const verification = await verifyWeeksData();
    
    log('🎉 Weeks database seeding completed successfully!', 'SUCCESS');
    log('Summary:', 'INFO');
    log(`  - ${verification.length} weeks updated with real program data`, 'SUCCESS');
    log('  - Week 1: Laying the Foundation: Aspiration and Exploration', 'INFO');
    log('  - Week 2: Charting the Course: A Detailed Look at Major Career Fields', 'INFO');
    log('  - Week 3: Inspiring Young Minds Through Creative Engagement', 'INFO');
    log('  - Week 4: Bridging the Gap: From Traditional Paths to Emerging Opportunities', 'INFO');
    log('  - Week 5: Planning for the Future: Comprehensive Guidance and Practical Advice', 'INFO');
    
    process.exit(0);
    
  } catch (error) {
    log(`❌ Weeks seeding failed: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  weeksData
};
