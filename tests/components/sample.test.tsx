/**
 * Sample React component test to verify React Testing Library setup
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple test component
const TestComponent = ({ title = 'Test Title', children }: { title?: string; children?: React.ReactNode }) => {
  return (
    <div data-testid="test-component">
      <h1>{title}</h1>
      {children && <div data-testid="children-content">{children}</div>}
    </div>
  )
}

describe('React Testing Library Setup', () => {
  test('renders a simple component', () => {
    render(<TestComponent />)
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  test('renders component with custom props', () => {
    render(<TestComponent title="Career Guidance" />)
    
    expect(screen.getByText('Career Guidance')).toBeInTheDocument()
  })

  test('renders component with children', () => {
    render(
      <TestComponent title="Parent Component">
        <p>This is child content</p>
      </TestComponent>
    )
    
    expect(screen.getByText('Parent Component')).toBeInTheDocument()
    expect(screen.getByText('This is child content')).toBeInTheDocument()
    expect(screen.getByTestId('children-content')).toBeInTheDocument()
  })

  test('component has correct structure', () => {
    render(<TestComponent />)
    
    const component = screen.getByTestId('test-component')
    expect(component).toBeInTheDocument()
    expect(component.tagName).toBe('DIV')
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})