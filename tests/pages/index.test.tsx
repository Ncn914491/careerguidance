/**
 * Home Page Tests
 * Tests the main home page component integration
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'

// Mock the HomePage component
jest.mock('@/components/features/HomePage', () => ({
  HomePage: function MockHomePage() {
    return (
      <div data-testid="homepage-component">
        <h1>Career Guidance Project Homepage</h1>
        <div data-testid="info-boxes">Info Boxes</div>
        <div data-testid="quick-actions">Quick Actions</div>
      </div>
    )
  }
}))

describe('Home Page', () => {
  test('renders home page component', () => {
    render(<Home />)

    expect(screen.getByTestId('homepage-component')).toBeInTheDocument()
    expect(screen.getByText('Career Guidance Project Homepage')).toBeInTheDocument()
  })

  test('renders HomePage component with correct structure', () => {
    render(<Home />)

    expect(screen.getByTestId('info-boxes')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
  })

  test('page renders without errors', () => {
    expect(() => render(<Home />)).not.toThrow()
  })
})