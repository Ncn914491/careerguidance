import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This is a simplified school extraction function
// In a real implementation, you would use PDF.js to parse PDFs and NLP to extract school names
function extractSchoolNamesFromText(text: string): string[] {
  const schoolKeywords = [
    'school', 'college', 'university', 'institute', 'academy', 'education',
    'high school', 'elementary', 'primary', 'secondary', 'campus'
  ];
  
  const lines = text.toLowerCase().split('\n');
  const potentialSchools: string[] = [];
  
  lines.forEach(line => {
    // Look for lines that contain school-related keywords
    const hasSchoolKeyword = schoolKeywords.some(keyword => 
      line.includes(keyword.toLowerCase())
    );
    
    if (hasSchoolKeyword) {
      // Extract potential school names (this is a simplified approach)
      const words = line.split(' ');
      let schoolName = '';
      
      // Look for capitalized words that might be school names
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length > 2 && /^[A-Z]/.test(word)) {
          schoolName += word + ' ';
          
          // Continue collecting words until we hit a school keyword or punctuation
          let j = i + 1;
          while (j < words.length && words[j].length > 2 && !/[.,:;]/.test(words[j])) {
            schoolName += words[j] + ' ';
            j++;
          }
          
          if (schoolName.trim().length > 5) {
            potentialSchools.push(schoolName.trim());
          }
          break;
        }
      }
    }
  });
  
  // Remove duplicates and filter out common false positives
  const uniqueSchools = [...new Set(potentialSchools)]
    .filter(name => name.length > 5 && name.length < 100)
    .slice(0, 10); // Limit to 10 schools per PDF
  
  return uniqueSchools;
}

// Mock function to simulate PDF text extraction
// In reality, you would use PDF.js or similar library
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  // This is a mock implementation
  // In a real scenario, you would:
  // 1. Download the PDF from the URL
  // 2. Use PDF.js to extract text content
  // 3. Return the extracted text
  
  // For now, return some sample text that might contain school names
  const sampleTexts = [
    `Visit to St. Mary's High School on January 15th. The students were very engaged during our career guidance session. Principal Johnson welcomed our team warmly.`,
    `Career guidance program at Delhi Public School was conducted successfully. Over 200 students attended the session about engineering careers.`,
    `Presentation at Kendriya Vidyalaya focused on medical career opportunities. The school administration was very supportive of our initiative.`,
    `Workshop at Modern School covered various career paths in technology. Students showed great interest in computer science and AI fields.`,
    `Session at Ryan International School discussed commerce and business career options. The career counselor Ms. Smith coordinated the event.`,
    `Visit to DAV Public School included interactive sessions on career planning. Students asked many thoughtful questions about their future.`,
    `Program at Bal Bharati Public School emphasized the importance of skill development. The principal appreciated our comprehensive approach.`,
    `Career fair at Sardar Patel Vidyalaya showcased multiple career opportunities. Over 300 students participated in the event.`
  ];
  
  // Return a random sample text to simulate PDF content
  return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
}

export async function POST() {
  try {
    // Fetch all weeks with PDF files
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select(`
        id,
        week_number,
        title,
        week_files!inner(
          id,
          file_name,
          file_type,
          file_url
        )
      `)
      .eq('week_files.file_type', 'pdf');

    if (weeksError) {
      console.error('Error fetching weeks:', weeksError);
      return NextResponse.json(
        { error: 'Failed to fetch weeks with PDFs' },
        { status: 500 }
      );
    }

    const extractedSchools: string[] = [];
    let processedFiles = 0;

    // Process each week's PDF files
    for (const week of weeks || []) {
      if ((week as any).week_files && (week as any).week_files.length > 0) {
        for (const file of (week as any).week_files) {
          try {
            // Extract text from PDF (mock implementation)
            const pdfText = await extractTextFromPDF(file.file_url);
            
            // Extract school names from text
            const schoolNames = extractSchoolNamesFromText(pdfText);
            
            // Add to our collection
            extractedSchools.push(...schoolNames);
            processedFiles++;
            
          } catch (error) {
            console.error(`Error processing PDF ${file.file_name}:`, error);
          }
        }
      }
    }

    // Remove duplicates and prepare for database insertion
    const uniqueSchools = [...new Set(extractedSchools)];
    
    // Insert extracted schools into database
    const schoolsToInsert = uniqueSchools.map(schoolName => ({
      name: schoolName,
      location: 'Location to be updated', // Placeholder
      visit_date: new Date().toISOString().split('T')[0] // Today's date as placeholder
    }));

    let insertedCount = 0;
    
    if (schoolsToInsert.length > 0) {
      // Check for existing schools to avoid duplicates
      const { data: existingSchools } = await supabase
        .from('schools')
        .select('name');
      
      const existingNames = new Set(existingSchools?.map(s => (s as any).name) || []);
      
      const newSchools = schoolsToInsert.filter(school => 
        !existingNames.has(school.name)
      );
      
      if (newSchools.length > 0) {
        const { data: insertedSchools, error: insertError } = await (supabase as any)
          .from('schools')
          .insert(newSchools)
          .select();

        if (insertError) {
          console.error('Error inserting schools:', insertError);
        } else {
          insertedCount = insertedSchools?.length || 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed_files: processedFiles,
      extracted: insertedCount,
      total_found: uniqueSchools.length,
      message: `Processed ${processedFiles} PDF files and extracted ${insertedCount} new schools`
    });

  } catch (error) {
    console.error('Unexpected error during school extraction:', error);
    return NextResponse.json(
      { error: 'Internal server error during school extraction' },
      { status: 500 }
    );
  }
}