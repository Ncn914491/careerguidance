// Test script to check career resources functionality
const testCareerResources = async () => {
  console.log('Testing career resources API...');
  
  try {
    // Test GET endpoint
    const response = await fetch('http://localhost:3000/api/career-resources');
    console.log('GET /api/career-resources status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Career resources data:', JSON.stringify(data, null, 2));
      console.log('Number of career resources:', data.careerResources?.length || 0);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing career resources:', error.message);
  }
};

testCareerResources();
