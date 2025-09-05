/**
 * Sample test to verify Jest and testing setup works correctly
 */

describe('Testing Infrastructure Setup', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true)
  })

  test('Math operations work as expected', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
  })

  test('String operations work as expected', () => {
    const testString = 'Career Guidance Website'
    expect(testString).toContain('Career')
    expect(testString.toLowerCase()).toBe('career guidance website')
    expect(testString.length).toBe(23)
  })

  test('Array operations work as expected', () => {
    const testArray = [1, 2, 3, 4, 5]
    expect(testArray).toHaveLength(5)
    expect(testArray).toContain(3)
    expect(testArray[0]).toBe(1)
  })

  test('Object operations work as expected', () => {
    const testObject = {
      name: 'Test User',
      role: 'student',
      active: true
    }
    expect(testObject).toHaveProperty('name')
    expect(testObject.role).toBe('student')
    expect(testObject.active).toBeTruthy()
  })
})